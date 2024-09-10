function validateForm() {
    const name = document.getElementById('name').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const email = document.getElementById('email').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();
    const message = document.getElementById('message').value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactNumberRegex = /^\d{10}$/;

    if (name === '') {
        alert('Please enter your name.');
        return false;
    }

    if (surname === '') {
        alert('Please enter your surname.');
        return false;
    }

    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return false;
    }

    if (contactNumber === '') {
        alert('Please enter your contact number.');
        return false;
    }

    if (message === '') {
        alert('Please enter your message.');
        return false;
    }

    // Validate reCAPTCHA
    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
        alert('Please verify that you are not a robot.');
        return false;
    }

    return true;
}