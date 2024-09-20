import torch.nn as nn
import torch

class LogisticRegression(nn.Module):
    def __init__(self, input_size, num_classes):
        super(LogisticRegression, self).__init__()
        self.linear = nn.Linear(input_size, num_classes)
    
    def forward(self, x):
        return self.linear(x)

# Example usage:
# model = LogisticRegression(input_size=28*28, num_classes=10)