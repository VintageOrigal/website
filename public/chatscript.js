const socket = io();

    // Toggle chat popup
    const chatButton = document.querySelector('#chat-button');
    const chatPopup = document.querySelector('#chat-popup');
    chatButton.addEventListener('click', () => {
      chatPopup.style.display = chatPopup.style.display === 'none' || chatPopup.style.display === '' ? 'block' : 'none';
    });

    // Handle form submit
    document.querySelector('#form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.querySelector('#input');
      const msg = input.value;
      
      // Send message to the server
      if (msg) {
        socket.emit('chatMessage', msg);
        input.value = '';
      }
    });

    // Display received message in the chat window
    socket.on('chatMessage', (msg) => {
      const messages = document.querySelector('#messages');
      const li = document.createElement('li');
      li.textContent = msg;
      messages.appendChild(li);
    });