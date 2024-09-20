import tensorflow as tf
from tensorflow.keras.datasets import mnist
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Load and preprocess MNIST data for digit classification
(train_images, train_labels), (test_images, test_labels) = mnist.load_data()
train_images, test_images = train_images / 255.0, test_images / 255.0

# Define and compile a model for digit classification
digit_model = tf.keras.Sequential([
    tf.keras.layers.Flatten(input_shape=(28, 28)),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])

digit_model.compile(optimizer='adam',
                    loss='sparse_categorical_crossentropy',
                    metrics=['accuracy'])

# Train digit classification model
digit_model.fit(train_images, train_labels, epochs=5)

# Evaluate digit classification model
test_loss, test_acc = digit_model.evaluate(test_images, test_labels)
print(f'\nDigit Classification Test accuracy: {test_acc}')

# Save the digit classification model
digit_model.save('digit_model.h5')

# Load the digit classification model
loaded_digit_model = tf.keras.models.load_model('digit_model.h5')

# Example for NLP model (Assuming text data is available)
texts = ['I love programming', 'TensorFlow is amazing', 'Natural Language Processing is fun']
labels = [1, 1, 1]  # Example binary labels

tokenizer = Tokenizer(num_words=10000)
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
data = pad_sequences(sequences, maxlen=50)

# Define and compile a model for text classification
text_model = tf.keras.Sequential([
    tf.keras.layers.Embedding(input_dim=10000, output_dim=64, input_length=50),
    tf.keras.layers.GlobalAveragePooling1D(),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

text_model.compile(optimizer='adam',
                   loss='binary_crossentropy',
                   metrics=['accuracy'])

# Train text classification model
text_model.fit(data, labels, epochs=5)

# Save the text classification model
text_model.save('text_model.keras')

# Load the text classification model
loaded_text_model = tf.keras.models.load_model('text_model.h5')

# Example for image classification (Using MobileNetV2)
datagen = ImageDataGenerator(rescale=1./255)
train_generator = datagen.flow_from_directory(
    'path_to_train_images',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical'
)

# Load pre-trained MobileNetV2 and fine-tune
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
x = base_model.output
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dense(1024, activation='relu')(x)
predictions = tf.keras.layers.Dense(10, activation='softmax')(x)

image_model = tf.keras.Model(inputs=base_model.input, outputs=predictions)
image_model.compile(optimizer='adam',
                    loss='categorical_crossentropy',
                    metrics=['accuracy'])

# Train image classification model
image_model.fit(train_generator, epochs=5)

# Save the image classification model
image_model.save('image_model.h5')

# Load the image classification model
loaded_image_model = tf.keras.models.load_model('image_model.h5')