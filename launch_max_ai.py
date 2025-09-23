#!/usr/bin/env python3
"""
Max AI Complete Launcher
Launches both frontend and backend with all Jarvis capabilities
"""

import os
import sys
import subprocess
import threading
import time
from pathlib import Path

def print_banner():
    print("=" * 80)
    print("🤖 MAX AI with JARVIS CAPABILITIES")
    print("=" * 80)
    print("🚀 Complete AI Assistant with:")
    print("   • Advanced Natural Language Processing")
    print("   • Voice Recognition & Synthesis") 
    print("   • Computer Vision & Face Recognition")
    print("   • Task Automation & System Control")
    print("   • Continuous Learning & Memory")
    print("   • Real-time Conversation Processing")
    print("=" * 80)

def start_backend():
    """Start the Python backend API"""
    print("🌐 Starting Max AI Backend Server...")
    
    try:
        # Determine project root relative to this file
        project_root = Path(__file__).resolve().parent
        
        # Start the backend server (log output to file to avoid PIPE blocking)
        logs_dir = project_root / 'logs'
        logs_dir.mkdir(parents=True, exist_ok=True)
        backend_log = open(logs_dir / 'backend.out.log', 'a')
        backend_err = open(logs_dir / 'backend.err.log', 'a')
        backend_process = subprocess.Popen([
            sys.executable, str(project_root / "backend/max_jarvis_api.py")
        ], cwd=str(project_root), stdout=backend_log, stderr=backend_err, text=True)
        
        print("✅ Backend server started at http://localhost:5001")
        return backend_process
        
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return None

def start_frontend():
    """Start the React frontend"""
    print("⚛️ Starting React Frontend...")
    
    try:
        project_root = Path(__file__).resolve().parent
        # Ensure dependencies installed
        if not (project_root / 'node_modules').exists():
            print("📦 Installing frontend dependencies...")
            subprocess.check_call(["npm", "install"], cwd=str(project_root))
        # Start the frontend development server (log output to file)
        logs_dir = project_root / 'logs'
        logs_dir.mkdir(parents=True, exist_ok=True)
        frontend_log = open(logs_dir / 'frontend.out.log', 'a')
        frontend_err = open(logs_dir / 'frontend.err.log', 'a')
        frontend_process = subprocess.Popen([
            "npm", "run", "dev"
        ], cwd=str(project_root), stdout=frontend_log, stderr=frontend_err, text=True)
        
        print("✅ Frontend server started at http://localhost:8080")
        return frontend_process
        
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return None

def monitor_processes(backend_process, frontend_process):
    """Monitor running processes"""
    print("\n🔄 Max AI is now running!")
    print("🌐 Access your AI assistant at: http://localhost:5173")
    print("🔧 API server available at: http://localhost:5001")
    print("\n💬 Ready to chat! Try saying 'Hey Max' or type a message.")
    print("🛑 Press Ctrl+C to stop Max AI")
    
    try:
        while True:
            # Check if processes are still running
            if backend_process and backend_process.poll() is not None:
                print("⚠️ Backend process stopped unexpectedly")
                break
            if frontend_process and frontend_process.poll() is not None:
                print("⚠️ Frontend process stopped unexpectedly")
                break
            
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Max AI...")
        
        if backend_process:
            backend_process.terminate()
            print("✅ Backend stopped")
            
        if frontend_process:
            frontend_process.terminate()
            print("✅ Frontend stopped")
            
        print("👋 Max AI shutdown complete. Thanks for using Max AI!")

def main():
    """Main launcher function"""
    print_banner()
    
    # Start backend
    backend_process = start_backend()
    
    if not backend_process:
        print("❌ Cannot continue without backend server")
        return
    
    # Wait for backend to start
    print("⏳ Waiting for backend to initialize...")
    time.sleep(5)
    
    # Start frontend
    frontend_process = start_frontend()
    
    if not frontend_process:
        print("⚠️ Frontend failed to start, but backend is running")
        print("🌐 You can still access the API at http://localhost:5001")
    
    # Monitor processes
    monitor_processes(backend_process, frontend_process)

if __name__ == "__main__":
    main()
