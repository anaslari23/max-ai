function startRecognition() {
    var recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = function(event) {
        var transcript = event.results[0][0].transcript;
        document.getElementById('output').textContent = transcript;

        // Send the transcript to the backend
        fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({text: transcript})
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('output').textContent = data.response;
        });
    }
}