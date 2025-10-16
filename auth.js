document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 1. Lese Benutzername und Passwort aus den Formularfeldern.
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // 2. Speichere die Eingaben direkt im Session Storage.
        //    Diese werden auf der nächsten Seite für die Entschlüsselung benötigt.
        sessionStorage.setItem('crypto-user', username);
        sessionStorage.setItem('crypto-pass', password);

        // 3. Leite den Benutzer zur "Shell"-Seite weiter, die den Entschlüsselungsversuch startet.
        window.location.href = 'admin_shell.html';
    });
});