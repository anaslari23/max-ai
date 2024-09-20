function processCommand(command) {
    fetch('http://localhost:5000/api/voice-command', { // Updated URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: command })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('output').textContent = data.response;
        // Voice output using SpeechSynthesisUtterance
        var speech = new SpeechSynthesisUtterance(data.response);
        window.speechSynthesis.speak(speech);
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('output').textContent = "Error processing command";
    });
}