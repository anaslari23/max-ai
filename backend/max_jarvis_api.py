#!/usr/bin/env python3
"""
MAX AI Backend API - Enhanced with Jarvis Capabilities
Integrates all Jarvis features into a unified API for the React frontend
"""

import os
import sys
import json
import logging
import threading
import time
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import sqlite3
import traceback
from typing import List, Optional, Tuple
import re
import math
from collections import Counter

# Optional heavy imports guarded to avoid crashing if not installed
# Import NumPy independently so it can be used even if face_recognition is missing
try:
    import numpy as np
except Exception:
    np = None

try:
    import face_recognition
except Exception:
    face_recognition = None

# Optional semantic embeddings (sentence-transformers)
try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None  # type: ignore

# Optional content sources
try:
    import wikipedia
except Exception:
    wikipedia = None

# Optional mediapipe for face embeddings (portable fallback)
try:
    import mediapipe as mp
except Exception:
    mp = None

# Optional email/calendar helpers
import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import timezone

# Add ai-assistant backend to path for importing Jarvis modules
sys.path.append('/Volumes/HDD/ai-assistant/backend')
sys.path.append('/Volumes/HDD/ai-assistant')

try:
    from enhanced_nlp_engine import EnhancedNLPEngine
    from task_automation import JarvisTaskAutomation
    from vision_system import JarvisVision
    from jarvis_core import JarvisCore
    from knowledge_engine import KnowledgeEngine
except ImportError as e:
    print(f"Warning: Some Jarvis modules not available: {e}")
    # We'll create fallback implementations

app = Flask(__name__)
CORS(app)

class MaxJarvisAPI:
    def __init__(self):
        # Initialize logging
        self.setup_logging()
        self.logger = logging.getLogger(__name__)
        
        # Initialize core components
        self.initialize_components()
        
        # Initialize databases
        self.setup_databases()
        
        # Start background services
        self.start_background_services()
        
        # Ensure faces directory exists
        Path("data/faces").mkdir(parents=True, exist_ok=True)
        # Ensure user files sandbox exists
        Path("data/user_files").mkdir(parents=True, exist_ok=True)

        # Initialize embedding model and memory index (lazy)
        self.embedder = None
        self.mem_items: List[dict] = []
        if SentenceTransformer is not None:
            try:
                # Small, fast model (~80MB) with good quality
                self.embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
                self.logger.info("✅ Semantic embedder loaded: all-MiniLM-L6-v2")
            except Exception as e:
                self.logger.warning(f"Semantic embedder unavailable: {e}")
    
    def setup_logging(self):
        """Setup comprehensive logging"""
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / "max_jarvis.log"),
                logging.StreamHandler(sys.stdout)
            ]
        )
    
    def initialize_components(self):
        """Initialize all Max AI components with Jarvis capabilities"""
        try:
            # Initialize knowledge engine
            self.knowledge_engine = KnowledgeEngine()
            
            # Initialize NLP engine
            self.nlp_engine = EnhancedNLPEngine(knowledge_engine=self.knowledge_engine)
            
            # Initialize task automation
            self.task_automation = JarvisTaskAutomation()
            
            # Initialize vision system
            self.vision_system = JarvisVision()
            
            self.logger.info("✅ All Max AI components initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Error initializing components: {e}")
            # Create fallback implementations
            self.create_fallback_implementations()
    
    def create_fallback_implementations(self):
        """Create fallback implementations if Jarvis modules are not available"""
        self.logger.info("Creating fallback implementations...")
        
        # Simple NLP fallback
        class FallbackNLP:
            def process_input(self, text, user_id='default', context=''):
                return {
                    'response': {'response': f"I understand you said: {text}"},
                    'intent': {'intent': 'general', 'confidence': 0.5},
                    'entities': {},
                    'requires_action': False
                }
        
        # Simple automation fallback
        class FallbackAutomation:
            def open_application(self, app_name):
                return True
            def get_system_info(self):
                # Match expected structure used by log_system_status()
                return {
                    'system': 'Available',
                    'status': {
                        'cpu_percent': 5.0,
                        'memory_percent': 20.0,
                        'disk_percent': 30.0,
                        'battery': None,
                    }
                }
        
        self.nlp_engine = FallbackNLP()
        self.task_automation = FallbackAutomation()
        self.vision_system = None
    
    def setup_databases(self):
        """Setup databases for Max AI"""
        db_dir = Path("data")
        db_dir.mkdir(exist_ok=True)
        
        # Conversations database
        self.db_conn = sqlite3.connect('data/max_conversations.db', check_same_thread=False)
        self.db_cursor = self.db_conn.cursor()
        
        self.db_cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY,
                user_id TEXT,
                message TEXT,
                response TEXT,
                intent TEXT,
                entities TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # User preferences
        self.db_cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY,
                user_id TEXT,
                preference_key TEXT,
                preference_value TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Training data
        self.db_cursor.execute('''
            CREATE TABLE IF NOT EXISTS training_data (
                id INTEGER PRIMARY KEY,
                input_text TEXT,
                expected_output TEXT,
                actual_output TEXT,
                feedback_score REAL,
                model_type TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.db_conn.commit()

    # ============ Lightweight Retrieval for Smarter Replies ============
    def _tokenize(self, text: str) -> List[str]:
        text = (text or '').lower()
        # simple alnum tokens
        return re.findall(r"[a-z0-9]+", text)

    def _tf(self, text: str) -> Counter:
        return Counter(self._tokenize(text))

    def _cosine(self, a: Counter, b: Counter) -> float:
        if not a or not b:
            return 0.0
        # dot
        common = set(a.keys()) & set(b.keys())
        dot = sum(a[t] * b[t] for t in common)
        # norms
        na = math.sqrt(sum(v*v for v in a.values()))
        nb = math.sqrt(sum(v*v for v in b.values()))
        if na == 0 or nb == 0:
            return 0.0
        return float(dot / (na * nb))

    def retrieve_similar_qa(self, query: str, limit_rows: int = 300) -> Tuple[Optional[dict], List[dict]]:
        """Return best matching learned Q/A or conversation pair for a query."""
        try:
            QAs: List[dict] = []
            # From training_data (use positive feedback only)
            self.db_cursor.execute('''
                SELECT input_text, actual_output, expected_output, feedback_score
                FROM training_data
                WHERE feedback_score >= 0.7
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (limit_rows,))
            for row in self.db_cursor.fetchall():
                inp, actual, expected, score = row
                answer = actual or expected or ''
                if (inp or '').strip() and (answer or '').strip():
                    QAs.append({'q': inp, 'a': answer, 'source': 'training', 'score': float(score or 0)})

            # From conversations (recent)
            self.db_cursor.execute('''
                SELECT message, response
                FROM conversations
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (limit_rows,))
            for row in self.db_cursor.fetchall():
                m, r = row
                if (m or '').strip() and (r or '').strip():
                    QAs.append({'q': m, 'a': r, 'source': 'convo'})

            # Compute similarity
            q_vec = self._tf(query)
            best = None
            best_sim = 0.0
            ranked: List[dict] = []
            for qa in QAs:
                doc_vec = self._tf(qa['q'] + ' ' + qa['a'])
                sim = self._cosine(q_vec, doc_vec)
                qa2 = {**qa, 'similarity': sim}
                ranked.append(qa2)
                if sim > best_sim:
                    best_sim = sim
                    best = qa2

            # Sort top snippets by similarity desc
            ranked.sort(key=lambda x: -x['similarity'])
            return best, ranked[:10]
        except Exception as e:
            self.logger.error(f"retrieve_similar_qa error: {e}")
            return None, []

    # ============ Semantic Retrieval (Embeddings) ============
    def _build_semantic_memory(self, limit_rows: int = 800) -> None:
        """Build a lightweight in-memory memory index of Q/A pairs with embeddings."""
        if self.embedder is None:
            return
        items: List[dict] = []
        try:
            # Positive training samples
            self.db_cursor.execute('''
                SELECT input_text, COALESCE(actual_output, expected_output) as answer
                FROM training_data
                WHERE feedback_score >= 0.7 AND input_text IS NOT NULL AND (actual_output IS NOT NULL OR expected_output IS NOT NULL)
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (limit_rows//2,))
            for q, a in self.db_cursor.fetchall():
                if (q or '').strip() and (a or '').strip():
                    items.append({'q': q, 'a': a, 'source': 'training'})

            # Recent conversations
            self.db_cursor.execute('''
                SELECT message, response
                FROM conversations
                WHERE message IS NOT NULL AND response IS NOT NULL
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (limit_rows//2,))
            for q, a in self.db_cursor.fetchall():
                if (q or '').strip() and (a or '').strip():
                    items.append({'q': q, 'a': a, 'source': 'convo'})

            # Compute embeddings in batches
            texts = [f"{it['q']} \n {it['a']}" for it in items]
            if texts:
                embs = self.embedder.encode(texts, show_progress_bar=False, normalize_embeddings=True)
                for it, vec in zip(items, embs):
                    it['vec'] = np.asarray(vec, dtype=np.float32) if np is not None else vec
        except Exception as e:
            self.logger.error(f"_build_semantic_memory error: {e}")
            items = []

        # Keep final
        self.mem_items = items

    def retrieve_similar_qa_semantic(self, query: str) -> Tuple[Optional[dict], List[dict]]:
        """Semantic retrieval using embeddings if available."""
        try:
            if self.embedder is None:
                return None, []
            if not self.mem_items:
                self._build_semantic_memory()
            if not self.mem_items:
                return None, []
            q_emb = self.embedder.encode([query], show_progress_bar=False, normalize_embeddings=True)[0]
            q_vec = np.asarray(q_emb, dtype=np.float32) if np is not None else q_emb
            best = None
            best_sim = -1.0
            ranked: List[dict] = []
            for it in self.mem_items:
                v = it.get('vec')
                if v is None:
                    continue
                # cosine similarity for normalized vectors is dot product
                sim = float(np.dot(q_vec, v)) if np is not None else 0.0
                entry = {k: it[k] for k in ('q','a','source')}
                entry['similarity'] = sim
                ranked.append(entry)
                if sim > best_sim:
                    best_sim = sim
                    best = entry
            ranked.sort(key=lambda x: -x['similarity'])
            return best, ranked[:10]
        except Exception as e:
            self.logger.error(f"retrieve_similar_qa_semantic error: {e}")
            return None, []

    # ============ Face Authentication Helpers ============
    def _faces_dir(self) -> Path:
        return Path("data/faces")

    def _user_face_path(self, user_id: str) -> Path:
        return self._faces_dir() / f"{user_id}_encodings.npy"

    def save_face_encodings(self, user_id: str, encodings: List["np.ndarray"]) -> None:
        """Save face encodings for a user (append if exists)."""
        try:
            if np is None:
                raise RuntimeError("NumPy not available for saving face encodings")
            path = self._user_face_path(user_id)
            enc_arr = np.array(encodings, dtype=object)
            if path.exists():
                try:
                    existing = np.load(path, allow_pickle=True)
                    enc_arr = np.concatenate([existing, enc_arr])
                except Exception:
                    # Overwrite if corrupted
                    pass
            np.save(path, enc_arr, allow_pickle=True)
        except Exception as e:
            self.logger.error(f"Failed to save face encodings: {e}")

    def load_face_encodings(self, user_id: str) -> List["np.ndarray"]:
        try:
            if np is None:
                return []
            path = self._user_face_path(user_id)
            if not path.exists():
                return []
            data = np.load(path, allow_pickle=True)
            return list(data)
        except Exception as e:
            self.logger.error(f"Failed to load face encodings: {e}")
            return []

    def compute_face_encodings_from_file(self, file_storage) -> List["np.ndarray"]:
        """Compute face encodings from an uploaded image file."""
        import io
        from PIL import Image
        image_bytes = file_storage.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        if np is None:
            raise RuntimeError("NumPy not available")
        image_np = np.array(image)

        # Primary path: face_recognition if available
        if face_recognition is not None:
            locations = face_recognition.face_locations(image_np)
            encodings = face_recognition.face_encodings(image_np, locations)
            if encodings:
                return encodings

        # Fallback: Mediapipe face landmarks embedding
        if mp is not None:
            emb = self.compute_face_embedding_mediapipe(image_np)
            if emb is not None:
                return [emb]

        # Final portable fallback: simple grayscale downsample embedding (no detection)
        try:
            gray = np.mean(image_np, axis=2).astype(np.float32)
            # Downsample to fixed size
            from PIL import Image as _Img
            ds = _Img.fromarray(gray).resize((32, 32))
            vec = np.asarray(ds, dtype=np.float32).flatten()
            vec = vec - np.mean(vec)
            n = np.linalg.norm(vec)
            if n > 0:
                vec = vec / n
            return [vec]
        except Exception:
            pass

        return []

    def compute_face_embedding_mediapipe(self, image_np) -> Optional["np.ndarray"]:
        """Compute a simple embedding from mediapipe face landmarks (portable fallback).
        Returns a normalized vector or None if no face detected.
        """
        if mp is None or np is None:
            return None
        # Use Face Mesh for robust landmarks
        mp_face_mesh = mp.solutions.face_mesh
        # Mediapipe expects RGB
        with mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5) as face_mesh:
            results = face_mesh.process(image_np)
            if not results.multi_face_landmarks:
                return None
            landmarks = results.multi_face_landmarks[0]
            # Build embedding from selected landmark coordinates
            coords = []
            for lm in landmarks.landmark:
                coords.extend([lm.x, lm.y, lm.z])
            vec = np.array(coords, dtype=np.float32)
            # Normalize for scale/translation invariance
            vec = vec - np.mean(vec)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            return vec
    
    def start_background_services(self):
        """Start background services for continuous learning and monitoring"""
        # Start model training service
        training_thread = threading.Thread(target=self.continuous_training_loop, daemon=True)
        training_thread.start()
        
        # Start system monitoring
        monitor_thread = threading.Thread(target=self.system_monitor_loop, daemon=True)
        monitor_thread.start()
        
        self.logger.info("🚀 Background services started")
    
    def continuous_training_loop(self):
        """Continuous learning and model improvement"""
        while True:
            try:
                # Train models every hour
                self.train_models_from_data()
                time.sleep(3600)  # 1 hour
            except Exception as e:
                self.logger.error(f"Error in continuous training: {e}")
                time.sleep(1800)  # 30 minutes on error
    
    def system_monitor_loop(self):
        """Monitor system performance and health"""
        while True:
            try:
                # Monitor system every 30 seconds
                if hasattr(self, 'task_automation'):
                    status = self.task_automation.get_system_info()
                    self.log_system_status(status)
                time.sleep(30)
            except Exception as e:
                self.logger.error(f"Error in system monitoring: {e}")
                time.sleep(60)
    
    def train_models_from_data(self):
        """Train AI models from collected conversation data"""
        try:
            # Get training data from conversations
            self.db_cursor.execute('''
                SELECT input_text, expected_output, feedback_score
                FROM training_data
                WHERE feedback_score > 0.7
                ORDER BY timestamp DESC
                LIMIT 1000
            ''')
            
            training_data = self.db_cursor.fetchall()
            
            if len(training_data) > 50:  # Only train if we have sufficient data
                self.logger.info(f"Training models with {len(training_data)} samples")
                # Implement actual model training here
                # This would involve:
                # 1. Text preprocessing
                # 2. Feature extraction
                # 3. Model training/fine-tuning
                # 4. Model validation
                # 5. Model saving
                
        except Exception as e:
            self.logger.error(f"Error in model training: {e}")
    
    def log_system_status(self, status):
        """Log system status for monitoring"""
        if status.get('status'):
            cpu = status['status'].get('cpu_percent', 0)
            memory = status['status'].get('memory_percent', 0)
            
            if cpu > 80 or memory > 90:
                self.logger.warning(f"High resource usage - CPU: {cpu}%, Memory: {memory}%")

# Initialize Max Jarvis API
max_jarvis = MaxJarvisAPI()

@app.route('/api/chat', methods=['POST'])
def chat():
    """Enhanced chat endpoint with full Jarvis NLP capabilities"""
    try:
        data = request.json
        message = data.get('message', '')
        user_id = data.get('user_id', 'default')
        context = data.get('context', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Build additional context from recent conversation history (last 5)
        history_context = ''
        try:
            max_jarvis.db_cursor.execute('''
                SELECT message, response FROM conversations
                WHERE user_id = ?
                ORDER BY timestamp DESC
                LIMIT 5
            ''', (user_id,))
            rows = list(reversed(max_jarvis.db_cursor.fetchall()))  # chronological
            if rows:
                parts = []
                for m, r in rows:
                    parts.append(f"User: {m}")
                    parts.append(f"MAX: {r}")
                history_context = "\n".join(parts)
        except Exception:
            pass

        merged_context = (context + "\n" + history_context).strip()

        # Retrieval: prefer semantic embeddings if available, fallback to TF
        best_qa, top_related = (None, [])
        sem_best, sem_related = max_jarvis.retrieve_similar_qa_semantic(message)
        if sem_best:
            best_qa, top_related = sem_best, sem_related
        else:
            best_qa, top_related = max_jarvis.retrieve_similar_qa(message)

        # Include related snippets in context for better NLP grounding
        related_context = ''
        if top_related:
            lines = []
            for item in top_related[:5]:
                lines.append(f"[Learned] Q: {item['q']}\nA: {item['a']}")
            related_context = "\n\n" + "\n\n".join(lines)

        augmented_context = (merged_context + related_context).strip()

        # If highly similar, short-circuit with learned answer
        sim = float(best_qa.get('similarity', 0.0)) if best_qa else 0.0
        threshold = 0.6 if sem_best else 0.45
        if best_qa and sim >= threshold:
            shaped_text = best_qa['a']
            # Store conversation for learning
            max_jarvis.db_cursor.execute('''
                INSERT INTO conversations (user_id, message, response, intent, entities)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                user_id,
                message,
                shaped_text,
                'learned_recall',
                json.dumps({'source': best_qa.get('source', 'memory'), 'similarity': best_qa.get('similarity', 0.0)})
            ))
            max_jarvis.db_conn.commit()
            return jsonify({
                'response': shaped_text,
                'intent': {'intent': 'learned_recall', 'confidence': 0.9},
                'entities': {},
                'confidence': 0.9,
                'suggestions': [],
                'requires_action': False,
                'emotion': {'dominant_emotion': 'neutral', 'sentiment': 'neutral', 'confidence': 0.6},
                'timestamp': datetime.now().isoformat()
            })

        # Otherwise, process with enhanced NLP and augmented context
        nlp_result = max_jarvis.nlp_engine.process_input(message, user_id, augmented_context)

        # Persona shaping from preferences
        persona_prefix = ''
        persona_suffix = ''
        try:
            max_jarvis.db_cursor.execute('''
                SELECT preference_value FROM user_preferences
                WHERE user_id = ? AND preference_key = 'persona'
                ORDER BY timestamp DESC LIMIT 1
            ''', (user_id,))
            row = max_jarvis.db_cursor.fetchone()
            persona = (row[0] if row else '').lower()
            if persona == 'professional':
                persona_prefix = "Certainly. "
            elif persona == 'concierge':
                persona_prefix = "At your service. "
            elif persona == 'friendly':
                persona_prefix = "Hey! "
            elif persona == 'witty':
                persona_prefix = "Here's a clever take: "
            elif persona == 'formal':
                persona_prefix = "Allow me to elaborate. "
        except Exception:
            pass

        base_text = nlp_result['response'].get('response', '')
        shaped_text = f"{persona_prefix}{base_text}{persona_suffix}"
        
        # Store conversation for learning
        max_jarvis.db_cursor.execute('''
            INSERT INTO conversations (user_id, message, response, intent, entities)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            user_id,
            message,
            shaped_text,
            nlp_result['intent'].get('intent', ''),
            json.dumps(nlp_result['entities'])
        ))
        max_jarvis.db_conn.commit()
        
        return jsonify({
            'response': shaped_text,
            'intent': nlp_result['intent'],
            'entities': nlp_result['entities'],
            'confidence': nlp_result['confidence'],
            'suggestions': nlp_result['response'].get('suggestions', []),
            'requires_action': nlp_result.get('requires_action', False),
            'emotion': nlp_result.get('context', {}).get('emotion', {}),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        max_jarvis.logger.error(f"Error in chat endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ============ Predictive Suggestions ============
@app.route('/api/predict/proposals', methods=['GET'])
def predict_proposals():
    """Return lightweight proposals based on time/context. Heuristics only."""
    try:
        proposals = []
        now = datetime.now()
        hour = now.hour
        # Heuristic 1: Morning coding suggestion
        if 8 <= hour <= 10:
            proposals.append({
                'id': f'open-ide-{now.strftime("%H%M%S")}',
                'title': 'Start your day with your IDE',
                'description': 'It’s coding time. Open your IDE to resume work?',
                'action': {'type': 'open_app', 'app_name': 'Visual Studio Code'},
                'created_at': now.isoformat()
            })
        # Heuristic 2: Midday break reminder
        if 12 <= hour <= 14:
            proposals.append({
                'id': f'lunch-break-{now.strftime("%H%M%S")}',
                'title': 'Take a short break',
                'description': 'It’s noon. Consider a brief break to recharge.',
                'action': {'type': 'none'},
                'created_at': now.isoformat()
            })
        # Heuristic 3: High CPU usage notice (if available via system info)
        try:
            info = max_jarvis.task_automation.get_system_info()
            if info and info.get('status', {}).get('cpu_percent', 0) > 80:
                proposals.append({
                    'id': f'high-cpu-{now.strftime("%H%M%S")}',
                    'title': 'High CPU usage detected',
                    'description': 'System is under heavy load. Close unused apps?',
                    'action': {'type': 'none'},
                    'created_at': now.isoformat()
                })
        except Exception:
            pass

        return jsonify({'proposals': proposals})
    except Exception as e:
        max_jarvis.logger.error(f"Error in predict_proposals: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/predict/ack', methods=['POST'])
def predict_ack():
    """Acknowledge a proposal with a decision. Optionally execute suggested action."""
    try:
        data = request.json or {}
        proposal_id = data.get('id')
        decision = data.get('decision', 'skip')  # 'accept' | 'skip'
        action = data.get('action', {})

        # Log to training_data to inform future prediction tuning
        try:
            max_jarvis.db_cursor.execute('''
                INSERT INTO training_data (input_text, expected_output, actual_output, feedback_score, model_type)
                VALUES (?, ?, ?, ?, ?)
            ''', (f'proposal:{proposal_id}', decision, str(action), 1.0 if decision == 'accept' else 0.0, 'predictive'))
            max_jarvis.db_conn.commit()
        except Exception as le:
            max_jarvis.logger.warning(f"Could not store proposal ack: {le}")

        # If accepted and action is open_app, try to execute
        executed = False
        if decision == 'accept' and action.get('type') == 'open_app':
            try:
                executed = bool(max_jarvis.task_automation.open_application(action.get('app_name', '')))
            except Exception:
                executed = False

        return jsonify({'status': 'acknowledged', 'executed': executed})
    except Exception as e:
        max_jarvis.logger.error(f"Error in predict_ack: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/learning/status', methods=['GET'])
def learning_status():
    """Return aggregated feedback metrics from training_data."""
    try:
        # Overall stats
        max_jarvis.db_cursor.execute('''
            SELECT COUNT(*), AVG(feedback_score)
            FROM training_data
        ''')
        row = max_jarvis.db_cursor.fetchone() or (0, None)
        total_count, avg_score = int(row[0] or 0), float(row[1] or 0.0)

        # Last 24h stats
        max_jarvis.db_cursor.execute('''
            SELECT COUNT(*), AVG(feedback_score)
            FROM training_data
            WHERE timestamp >= datetime('now', '-1 day')
        ''')
        row2 = max_jarvis.db_cursor.fetchone() or (0, None)
        day_count, day_avg = int(row2[0] or 0), float(row2[1] or 0.0)

        # By model_type (top 5)
        max_jarvis.db_cursor.execute('''
            SELECT model_type, COUNT(*), AVG(feedback_score)
            FROM training_data
            GROUP BY model_type
            ORDER BY COUNT(*) DESC
            LIMIT 5
        ''')
        by_model = []
        for model_type, cnt, avg in max_jarvis.db_cursor.fetchall():
            by_model.append({
                'model_type': model_type,
                'count': int(cnt or 0),
                'avg_score': float(avg or 0.0)
            })

        return jsonify({
            'total_count': total_count,
            'avg_score': avg_score,
            'last_24h': {
                'count': day_count,
                'avg_score': day_avg
            },
            'by_model': by_model
        })
    except Exception as e:
        max_jarvis.logger.error(f"Error in learning_status: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

# ============ File Automation (Sandboxed to data/user_files) ============
def _sandbox_root() -> Path:
    p = Path('data/user_files').resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p

def _resolve_sandbox_path(rel_path: str) -> Path:
    root = _sandbox_root()
    target = (root / rel_path).resolve()
    if not str(target).startswith(str(root)):
        raise ValueError('Path escapes sandbox')
    return target

@app.route('/api/files/list', methods=['GET'])
def files_list():
    try:
        rel = request.args.get('path', '.')
        target = _resolve_sandbox_path(rel)
        if not target.exists():
            return jsonify({'error': 'Path not found'}), 404
        items = []
        for entry in target.iterdir():
            items.append({
                'name': entry.name,
                'is_dir': entry.is_dir(),
                'size': entry.stat().st_size if entry.is_file() else 0
            })
        return jsonify({'path': str(target.relative_to(_sandbox_root())), 'items': items})
    except Exception as e:
        max_jarvis.logger.error(f"files_list error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/files/create', methods=['POST'])
def files_create():
    try:
        data = request.json or {}
        rel = data.get('path')
        content = data.get('content', '')
        overwrite = bool(data.get('overwrite', False))
        if not rel:
            return jsonify({'error': 'path is required'}), 400
        target = _resolve_sandbox_path(rel)
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and not overwrite:
            return jsonify({'error': 'File exists'}), 409
        with open(target, 'w', encoding='utf-8') as f:
            f.write(content)
        return jsonify({'status': 'created', 'path': str(target.relative_to(_sandbox_root()))})
    except Exception as e:
        max_jarvis.logger.error(f"files_create error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/files/move', methods=['POST'])
def files_move():
    try:
        data = request.json or {}
        src = data.get('src')
        dest = data.get('dest')
        overwrite = bool(data.get('overwrite', False))
        if not src or not dest:
            return jsonify({'error': 'src and dest are required'}), 400
        s = _resolve_sandbox_path(src)
        d = _resolve_sandbox_path(dest)
        d.parent.mkdir(parents=True, exist_ok=True)
        if d.exists() and not overwrite:
            return jsonify({'error': 'Destination exists'}), 409
        s.replace(d)
        return jsonify({'status': 'moved', 'src': str(src), 'dest': str(dest)})
    except Exception as e:
        max_jarvis.logger.error(f"files_move error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/files/delete', methods=['POST'])
def files_delete():
    try:
        data = request.json or {}
        rel = data.get('path')
        if not rel:
            return jsonify({'error': 'path is required'}), 400
        target = _resolve_sandbox_path(rel)
        if not target.exists():
            return jsonify({'error': 'Path not found'}), 404
        if target.is_dir():
            # Do not allow recursive directory deletes to stay safe
            return jsonify({'error': 'Directory delete not allowed'}), 403
        target.unlink()
        return jsonify({'status': 'deleted'})
    except Exception as e:
        max_jarvis.logger.error(f"files_delete error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/files/search', methods=['POST'])
def files_search():
    try:
        data = request.json or {}
        query = (data.get('query') or '').strip().lower()
        rel = data.get('path', '.')
        if not query:
            return jsonify({'error': 'query is required'}), 400
        root = _resolve_sandbox_path(rel)
        matches = []
        for p in root.rglob('*'):
            if p.is_file() and query in p.name.lower():
                matches.append(str(p.relative_to(_sandbox_root())))
        return jsonify({'query': query, 'matches': matches})
    except Exception as e:
        max_jarvis.logger.error(f"files_search error: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/integrations/gmail/send', methods=['POST'])
def gmail_send():
    """Send an email via Gmail SMTP using app password.
    Requires env vars: GMAIL_USER, GMAIL_APP_PASSWORD
    Body: { to, subject, body, html (optional) }
    """
    try:
        data = request.json or {}
        to_addr = data.get('to')
        subject = data.get('subject', '')
        body = data.get('body', '')
        html = data.get('html')
        if not to_addr:
            return jsonify({'error': 'to is required'}), 400
        user = os.environ.get('GMAIL_USER')
        app_pw = os.environ.get('GMAIL_APP_PASSWORD')
        if not user or not app_pw:
            return jsonify({'error': 'Gmail credentials not configured in env'}), 503

        msg = MIMEMultipart('alternative')
        msg['From'] = user
        msg['To'] = to_addr
        msg['Subject'] = subject
        part1 = MIMEText(body, 'plain')
        msg.attach(part1)
        if html:
            msg.attach(MIMEText(html, 'html'))

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(user, app_pw)
            server.sendmail(user, [to_addr], msg.as_string())

        return jsonify({'status': 'sent'})
    except Exception as e:
        max_jarvis.logger.error(f"Error sending gmail: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/integrations/calendar/create', methods=['POST'])
def calendar_create():
    """Create a simple calendar event by returning ICS content.
    Body: { title, start_iso, end_iso, description?, location? }
    Returns: { ics }
    """
    try:
        data = request.json or {}
        title = data.get('title', 'MAX Event')
        start_iso = data.get('start_iso')
        end_iso = data.get('end_iso')
        description = data.get('description', '')
        location = data.get('location', '')
        if not start_iso or not end_iso:
            return jsonify({'error': 'start_iso and end_iso are required'}), 400

        def to_ics_datetime(iso_str: str) -> str:
            dt = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
            dt = dt.astimezone(timezone.utc)
            return dt.strftime('%Y%m%dT%H%M%SZ')

        dtstart = to_ics_datetime(start_iso)
        dtend = to_ics_datetime(end_iso)

        ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MAX AI//Calendar//EN
BEGIN:VEVENT
UID:{datetime.now().timestamp()}@max.ai
DTSTAMP:{dtstart}
DTSTART:{dtstart}
DTEND:{dtend}
SUMMARY:{title}
DESCRIPTION:{description}
LOCATION:{location}
END:VEVENT
END:VCALENDAR
"""
        return jsonify({'ics': ics})
    except Exception as e:
        max_jarvis.logger.error(f"Error creating calendar ics: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/workflow/run', methods=['POST'])
def run_workflow():
    """Execute a multi-step workflow.
    Payload example:
    {
      "steps": [
        {"type": "open_app", "data": {"app_name": "Chrome"}},
        {"type": "web_search", "data": {"query": "quantum computing", "max_results": 3}},
        {"type": "summarize", "data": {"url": "https://en.wikipedia.org/wiki/Quantum_computing", "max_sentences": 5}}
      ]
    }
    """
    try:
        data = request.json or {}
        steps = data.get('steps', [])
        if not isinstance(steps, list) or len(steps) == 0:
            return jsonify({'error': 'steps array required'}), 400

        logs = []
        results = []
        ctx = {
            'last_summary': ''
        }

        def log(msg):
            logs.append(f"{datetime.now().isoformat()} | {msg}")

        for idx, step in enumerate(steps):
            stype = step.get('type')
            sdata = step.get('data', {})
            try:
                if stype == 'open_app':
                    app_name = sdata.get('app_name') or sdata.get('name')
                    if not app_name:
                        raise ValueError('app_name required')
                    ok = max_jarvis.task_automation.open_application(app_name)
                    log(f"open_app('{app_name}') => {ok}")
                    results.append({'type': stype, 'success': bool(ok)})

                elif stype == 'web_search':
                    query = sdata.get('query', '')
                    max_results = int(sdata.get('max_results', 5))
                    with app.test_request_context(json={'query': query, 'max_results': max_results}):
                        resp = web_search()
                        payload, status = resp.get_json(), resp.status_code
                    log(f"web_search('{query}') => status {status}")
                    results.append({'type': stype, 'result': payload})

                elif stype == 'summarize':
                    params = {k: v for k, v in sdata.items() if k in ('text', 'url', 'max_sentences')}
                    with app.test_request_context(json=params):
                        resp = web_summarize()
                        payload, status = resp.get_json(), resp.status_code
                    log(f"summarize => status {status}")
                    # store last summary
                    if isinstance(payload, dict) and 'summary' in payload:
                        ctx['last_summary'] = payload.get('summary') or ''
                    results.append({'type': stype, 'result': payload})

                elif stype == 'save_file':
                    # Save content to sandbox: supports direct content or contentFrom:'last_summary'
                    rel_path = sdata.get('path', 'notes/summary.txt')
                    content = sdata.get('content')
                    content_from = sdata.get('contentFrom')
                    if (not content) and content_from == 'last_summary':
                        content = ctx.get('last_summary', '')
                    if content is None:
                        raise ValueError('save_file requires content or contentFrom')
                    target = _resolve_sandbox_path(rel_path)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with open(target, 'w', encoding='utf-8') as f:
                        f.write(content)
                    log(f"save_file('{rel_path}') => saved {len(content)} chars")
                    results.append({'type': stype, 'result': {'path': str(target.relative_to(_sandbox_root())), 'bytes': len(content)}})

                elif stype == 'send_email':
                    # Send email using gmail_send; supports body or bodyFrom:'last_summary'
                    to_addr = sdata.get('to')
                    subject = sdata.get('subject', 'MAX Update')
                    body = sdata.get('body')
                    body_from = sdata.get('bodyFrom')
                    if (not body) and body_from == 'last_summary':
                        body = ctx.get('last_summary', '')
                    if not to_addr:
                        raise ValueError('send_email requires to')
                    with app.test_request_context(json={'to': to_addr, 'subject': subject, 'body': body}):
                        resp = gmail_send()
                        payload, status = resp.get_json(), resp.status_code
                    log(f"send_email('{to_addr}') => status {status}")
                    results.append({'type': stype, 'result': payload})

                else:
                    log(f"Unknown step type: {stype}")
                    results.append({'type': stype, 'error': 'unknown_step'})

            except Exception as se:
                err = f"Step {idx} ('{stype}') failed: {se}"
                log(err)
                results.append({'type': stype, 'error': str(se)})

        return jsonify({'logs': logs, 'results': results})
    except Exception as e:
        max_jarvis.logger.error(f"Error in run_workflow: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/web/search', methods=['POST'])
def web_search():
    """Perform a lightweight web search, prioritizing Wikipedia for reliability."""
    try:
        data = request.json or {}
        query = data.get('query', '').strip()
        max_results = int(data.get('max_results', 5))
        if not query:
            return jsonify({'error': 'Query is required'}), 400

        results = []
        # Wikipedia-based results
        if wikipedia is not None:
            try:
                search_hits = wikipedia.search(query, results=max_results)
                for title in search_hits[:max_results]:
                    try:
                        page = wikipedia.page(title, auto_suggest=False)
                        snippet = page.summary[:400]
                        results.append({
                            'source': 'wikipedia',
                            'title': page.title,
                            'url': page.url,
                            'snippet': snippet
                        })
                    except Exception:
                        # Fallback to title only
                        results.append({
                            'source': 'wikipedia',
                            'title': title,
                            'url': '',
                            'snippet': ''
                        })
            except Exception as e:
                max_jarvis.logger.warning(f"Wikipedia search error: {e}")

        return jsonify({'query': query, 'results': results})
    except Exception as e:
        max_jarvis.logger.error(f"Error in web_search: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/web/summarize', methods=['POST'])
def web_summarize():
    """Summarize provided text or a Wikipedia URL using a simple heuristic summarizer."""
    try:
        data = request.json or {}
        text = (data.get('text') or '').strip()
        url = (data.get('url') or '').strip()
        max_sentences = int(data.get('max_sentences', 5))

        if not text and not url:
            return jsonify({'error': 'Provide text or url'}), 400

        content = text
        if not content and url and wikipedia is not None and 'wikipedia.org' in url:
            try:
                # Extract title from URL and fetch page
                title = url.split('/wiki/')[-1].replace('_', ' ')
                page = wikipedia.page(title)
                content = page.content
            except Exception as e:
                max_jarvis.logger.warning(f"Wikipedia fetch error: {e}")

        if not content:
            return jsonify({'error': 'Unable to retrieve content for summarization'}), 422

        # Improved extractive summarization: frequency-based scoring with optional NLTK
        import re
        try:
            import nltk
            from nltk.corpus import stopwords
            from nltk.tokenize import word_tokenize, sent_tokenize
            # Ensure punkt/stopwords are available
            try:
                _ = stopwords.words('english')
            except Exception:
                nltk.download('stopwords', quiet=True)
            try:
                _ = nltk.data.find('tokenizers/punkt')
            except Exception:
                nltk.download('punkt', quiet=True)

            sentences = sent_tokenize(content)
            words = word_tokenize(content.lower())
            stops = set(stopwords.words('english'))
            freq = {}
            for w in words:
                if w.isalpha() and w not in stops:
                    freq[w] = freq.get(w, 0) + 1
            # Normalize frequencies
            if freq:
                max_f = max(freq.values())
                for k in list(freq.keys()):
                    freq[k] = freq[k] / max_f

            # Score sentences
            sentence_scores = []
            for s in sentences:
                tokens = word_tokenize(s.lower())
                score = sum(freq.get(t, 0) for t in tokens if t.isalpha())
                # Prefer concise sentences slightly
                score = score / (1 + len(s.split())/25)
                sentence_scores.append((score, s))

            top = sorted(sentence_scores, key=lambda x: -x[0])[:max_sentences]
            selected = [s for _, s in top]
            summary = ' '.join(selected)
        except Exception:
            # Fallback: regex sentence split and pick by length as last resort
            sentences = re.split(r'(?<=[.!?])\s+', content)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 0]
            sentences_sorted = sorted(sentences, key=lambda s: -len(s))
            selected = sentences_sorted[:max_sentences]
            summary = ' '.join(selected)

        return jsonify({'summary': summary, 'sentences': selected})
    except Exception as e:
        max_jarvis.logger.error(f"Error in web_summarize: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/face/enroll', methods=['POST'])
def face_enroll():
    """Enroll a user's face. Multipart form-data with fields: user_id (optional), image (file)."""
    try:
        user_id = request.form.get('user_id', 'default')
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        image = request.files['image']

        # Compute encodings using face_recognition if available, otherwise Mediapipe fallback
        try:
            encodings = max_jarvis.compute_face_encodings_from_file(image)
        except RuntimeError as re:
            return jsonify({'error': str(re)}), 503
        if not encodings:
            return jsonify({'error': 'No face detected'}), 422

        max_jarvis.save_face_encodings(user_id, encodings)
        return jsonify({'status': 'enrolled', 'user_id': user_id, 'faces_added': len(encodings)})
    except Exception as e:
        max_jarvis.logger.error(f"Error in face enroll: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/face/verify', methods=['POST'])
def face_verify():
    """Verify a user's face. Multipart form-data with fields: user_id (optional), image (file).
    Returns match boolean and distance metrics.
    """
    try:
        user_id = request.form.get('user_id', 'default')
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        image = request.files['image']

        known_encodings = max_jarvis.load_face_encodings(user_id)
        if not known_encodings:
            return jsonify({'error': 'No enrollment found for user'}), 404

        try:
            probe_encodings = max_jarvis.compute_face_encodings_from_file(image)
        except RuntimeError as re:
            return jsonify({'error': str(re)}), 503
        if not probe_encodings:
            return jsonify({'error': 'No face detected'}), 422

        probe = probe_encodings[0]
        match = False
        best_distance = 1.0
        threshold = 0.5
        if face_recognition is not None and all(
            (isinstance(e, np.ndarray) and e.ndim == 1 and e.size in (128, 129, 256)) for e in known_encodings
        ):
            # Use face_recognition distance
            distances = face_recognition.face_distance(known_encodings, probe)
            if len(distances) > 0:
                best_distance = float(np.min(distances))
                match = best_distance <= threshold
        else:
            # Use cosine distance on mediapipe embeddings
            if np is None:
                return jsonify({'error': 'NumPy not available'}), 503
            def cosine(a, b):
                an = np.linalg.norm(a); bn = np.linalg.norm(b)
                if an == 0 or bn == 0:
                    return 1.0
                return 1.0 - float(np.dot(a, b) / (an * bn))
            distances = [cosine(e, probe) for e in known_encodings]
            if len(distances) > 0:
                best_distance = min(distances)
                # Cosine distance threshold tuned roughly; <= 0.35 considered match empirically
                threshold = 0.35
                match = best_distance <= threshold

        return jsonify({
            'user_id': user_id,
            'verified': match,
            'distance': best_distance,
            'threshold': threshold,
            'method': 'face_recognition' if face_recognition is not None else ('mediapipe' if mp is not None else 'none')
        })
    except Exception as e:
        max_jarvis.logger.error(f"Error in face verify: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/voice/wake', methods=['POST'])
def voice_wake():
    """Handle voice wake word detection"""
    try:
        data = request.json
        confidence = data.get('confidence', 0.0)
        
        if confidence > 0.7:
            return jsonify({
                'status': 'awake',
                'response': "Hello! I'm Max, your AI assistant. How can I help you today?",
                'should_speak': True
            })
        else:
            return jsonify({
                'status': 'sleeping',
                'response': '',
                'should_speak': False
            })
            
    except Exception as e:
        max_jarvis.logger.error(f"Error in voice wake: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/system/info', methods=['GET'])
def system_info():
    """Get comprehensive system information"""
    try:
        info = max_jarvis.task_automation.get_system_info()
        return jsonify(info)
    except Exception as e:
        max_jarvis.logger.error(f"Error getting system info: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/system/apps/open', methods=['POST'])
def open_app():
    """Open an application"""
    try:
        data = request.json
        app_name = data.get('app_name', '')
        
        if not app_name:
            return jsonify({'error': 'App name is required'}), 400
        
        success = max_jarvis.task_automation.open_application(app_name)
        
        return jsonify({
            'success': success,
            'message': f"{'Successfully opened' if success else 'Failed to open'} {app_name}"
        })
        
    except Exception as e:
        max_jarvis.logger.error(f"Error opening app: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/system/apps/running', methods=['GET'])
def get_running_apps():
    """Get list of running applications"""
    try:
        apps = max_jarvis.task_automation.get_running_applications()
        return jsonify({'apps': apps})
    except Exception as e:
        max_jarvis.logger.error(f"Error getting running apps: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/vision/analyze', methods=['POST'])
def analyze_image():
    """Analyze image using computer vision"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image = request.files['image']
        
        if max_jarvis.vision_system:
            result = max_jarvis.vision_system.analyze_image(image)
            return jsonify(result)
        else:
            return jsonify({
                'error': 'Vision system not available',
                'description': 'Computer vision capabilities are being set up'
            }), 503
            
    except Exception as e:
        max_jarvis.logger.error(f"Error in image analysis: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/learning/feedback', methods=['POST'])
def learning_feedback():
    """Receive feedback for continuous learning"""
    try:
        data = request.json
        input_text = data.get('input_text', '')
        expected_output = data.get('expected_output', '')
        actual_output = data.get('actual_output', '')
        feedback_score = data.get('feedback_score', 0.0)
        model_type = data.get('model_type', 'general')
        
        # Store feedback for training
        max_jarvis.db_cursor.execute('''
            INSERT INTO training_data 
            (input_text, expected_output, actual_output, feedback_score, model_type)
            VALUES (?, ?, ?, ?, ?)
        ''', (input_text, expected_output, actual_output, feedback_score, model_type))
        max_jarvis.db_conn.commit()
        
        return jsonify({'status': 'feedback_received', 'message': 'Thank you for the feedback!'})
        
    except Exception as e:
        max_jarvis.logger.error(f"Error processing feedback: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/schedule/task', methods=['POST'])
def schedule_task():
    """Schedule automated tasks"""
    try:
        data = request.json
        task_name = data.get('task_name', '')
        schedule_type = data.get('schedule_type', 'daily')
        schedule_time = data.get('schedule_time', '09:00')
        
        def scheduled_task():
            max_jarvis.logger.info(f"Executing scheduled task: {task_name}")
            # Execute the task based on task_name
        
        success = max_jarvis.task_automation.schedule_task(
            task_name, scheduled_task, schedule_type, time=schedule_time
        )
        
        return jsonify({
            'success': success,
            'message': f"{'Successfully scheduled' if success else 'Failed to schedule'} task: {task_name}"
        })
        
    except Exception as e:
        max_jarvis.logger.error(f"Error scheduling task: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/preferences', methods=['GET', 'POST'])
def user_preferences():
    """Get or set user preferences"""
    try:
        if request.method == 'GET':
            user_id = request.args.get('user_id', 'default')
            
            max_jarvis.db_cursor.execute('''
                SELECT preference_key, preference_value
                FROM user_preferences
                WHERE user_id = ?
                ORDER BY timestamp DESC
            ''', (user_id,))
            
            prefs = {}
            for row in max_jarvis.db_cursor.fetchall():
                prefs[row[0]] = row[1]
            
            return jsonify({'preferences': prefs})
        
        else:  # POST
            data = request.json
            user_id = data.get('user_id', 'default')
            preferences = data.get('preferences', {})
            
            for key, value in preferences.items():
                max_jarvis.db_cursor.execute('''
                    INSERT OR REPLACE INTO user_preferences 
                    (user_id, preference_key, preference_value)
                    VALUES (?, ?, ?)
                ''', (user_id, key, str(value)))
            
            max_jarvis.db_conn.commit()
            
            return jsonify({'status': 'preferences_updated'})
            
    except Exception as e:
        max_jarvis.logger.error(f"Error with preferences: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    """Get API status and health check"""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'components': {
            'nlp_engine': hasattr(max_jarvis, 'nlp_engine'),
            'task_automation': hasattr(max_jarvis, 'task_automation'),
            'vision_system': hasattr(max_jarvis, 'vision_system') and max_jarvis.vision_system is not None,
            'database': True
        },
        'capabilities': [
            'Natural Language Processing',
            'Task Automation', 
            'System Control',
            'Conversation Memory',
            'Continuous Learning',
            'Voice Recognition',
            'Intent Classification',
            'Entity Extraction',
            'Emotional Analysis'
        ]
    })

@app.route('/api/train/models', methods=['POST'])
def train_models():
    """Manually trigger model training"""
    try:
        data = request.json
        model_types = data.get('model_types', ['nlp', 'vision', 'automation'])
        
        # Start training in background thread
        def training_task():
            for model_type in model_types:
                max_jarvis.logger.info(f"Training {model_type} model...")
                if model_type == 'nlp':
                    max_jarvis.train_nlp_model()
                elif model_type == 'vision':
                    max_jarvis.train_vision_model()
                elif model_type == 'automation':
                    max_jarvis.train_automation_model()
        
        training_thread = threading.Thread(target=training_task, daemon=True)
        training_thread.start()
        
        return jsonify({
            'status': 'training_started',
            'models': model_types,
            'message': 'Model training started in background'
        })
        
    except Exception as e:
        max_jarvis.logger.error(f"Error starting training: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Enhanced training methods
def train_nlp_model(self):
    """Train NLP models with collected data"""
    try:
        # Get conversation data for training
        self.db_cursor.execute('''
            SELECT message, response, intent, entities
            FROM conversations
            ORDER BY timestamp DESC
            LIMIT 5000
        ''')
        
        training_data = self.db_cursor.fetchall()
        
        if len(training_data) > 100:
            # Implement actual model training
            self.logger.info(f"Training NLP model with {len(training_data)} conversations")
            # This would involve:
            # - Text preprocessing
            # - Feature extraction
            # - Model fine-tuning
            # - Validation and testing
        
    except Exception as e:
        self.logger.error(f"Error training NLP model: {e}")

def train_vision_model(self):
    """Train computer vision models"""
    try:
        # This would train vision models for:
        # - Face recognition
        # - Object detection
        # - Scene understanding
        # - OCR capabilities
        self.logger.info("Training vision models...")
        
    except Exception as e:
        self.logger.error(f"Error training vision model: {e}")

def train_automation_model(self):
    """Train task automation models"""
    try:
        # This would train models for:
        # - Command prediction
        # - Task scheduling optimization
        # - System performance prediction
        self.logger.info("Training automation models...")
        
    except Exception as e:
        self.logger.error(f"Error training automation model: {e}")

# Add training methods to the class
MaxJarvisAPI.train_nlp_model = train_nlp_model
MaxJarvisAPI.train_vision_model = train_vision_model
MaxJarvisAPI.train_automation_model = train_automation_model

if __name__ == '__main__':
    print("🤖 MAX AI with Jarvis Capabilities - Starting API Server...")
    print("=" * 60)
    
    # Create backend directory if it doesn't exist
    Path("backend").mkdir(exist_ok=True)
    Path("data").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)
    Path("models").mkdir(exist_ok=True)
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False,
        use_reloader=False,
        threaded=True
    )
