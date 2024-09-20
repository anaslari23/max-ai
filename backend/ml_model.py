import torch
import torch.nn as nn
import torch.optim as optim
import torch.utils.data as data
from torchvision import datasets, transforms
from models.logistic_regression import LogisticRegression
from models.cnn_model import CNN
from models.rnn_model import RNN
from sklearn.metrics import accuracy_score, confusion_matrix
import numpy as np
import argparse
import os

# Define the neural network model
class SimpleNN(nn.Module):
    def __init__(self):
        super(SimpleNN, self).__init__()
        self.fc1 = nn.Linear(28 * 28, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 10)

    def forward(self, x):
        x = x.view(-1, 28 * 28)
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# Training function with validation
def train_and_validate(model, train_loader, val_loader, criterion, optimizer, num_epochs=5):
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        for inputs, labels in train_loader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
        
        # Validation
        model.eval()
        val_loss = 0.0
        all_labels = []
        all_preds = []
        with torch.no_grad():
            for inputs, labels in val_loader:
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                _, preds = torch.max(outputs, 1)
                all_labels.extend(labels.numpy())
                all_preds.extend(preds.numpy())
        
        # Print statistics
        avg_train_loss = running_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        accuracy = accuracy_score(all_labels, all_preds)
        cm = confusion_matrix(all_labels, all_preds)
        
        print(f"Epoch [{epoch+1}/{num_epochs}], "
              f"Train Loss: {avg_train_loss:.4f}, "
              f"Validation Loss: {avg_val_loss:.4f}, "
              f"Accuracy: {accuracy:.4f}")
        print("Confusion Matrix:")
        print(cm)

        # Save the model
        torch.save(model.state_dict(), f"model_epoch_{epoch+1}.pth")

# Main function to load data, define model, and start training
def main(args):
    # Define transformations for the dataset
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])

    # Load the dataset (MNIST in this example)
    train_dataset = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
    val_dataset = datasets.MNIST(root='./data', train=False, download=True, transform=transform)
    
    train_loader = data.DataLoader(dataset=train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = data.DataLoader(dataset=val_dataset, batch_size=args.batch_size, shuffle=False)

    # Model selection
    print("Select the model for training:")
    print("1. SimpleNN")
    print("2. Logistic Regression")
    print("3. CNN")
    print("4. RNN")

    model_choice = int(input("Enter the model number (1/2/3/4): "))

    if model_choice == 1:
        model = SimpleNN()
    elif model_choice == 2:
        model = LogisticRegression(input_size=28 * 28, num_classes=10)
    elif model_choice == 3:
        model = CNN()
    elif model_choice == 4:
        model = RNN(input_size=28, hidden_size=128, output_size=10)
    else:
        print("Invalid choice! Defaulting to SimpleNN.")
        model = SimpleNN()

    # Initialize the loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.learning_rate)

    # Train and validate the model
    train_and_validate(model, train_loader, val_loader, criterion, optimizer, num_epochs=args.num_epochs)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and evaluate neural network models.")
    parser.add_argument('--batch_size', type=int, default=64, help='Batch size for training and validation.')
    parser.add_argument('--learning_rate', type=float, default=0.001, help='Learning rate for the optimizer.')
    parser.add_argument('--num_epochs', type=int, default=5, help='Number of epochs for training.')
    args = parser.parse_args()
    main(args)