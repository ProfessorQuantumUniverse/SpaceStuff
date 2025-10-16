// Konfiguration
// WICHTIG: Ersetze diese URL durch deine eigene Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbxbc7A9oylZl1JDa-Lh7TrD819D1_x0Jh9O18jwowc35iGhJ-Tv6loGHBXdhMyS-v55Uw/exec';

document.addEventListener('DOMContentLoaded', () => {
    const wishlistsContainer = document.getElementById('wishlists-container');
    const sortFilter = document.getElementById('sort-filter');
    let allData = []; // Zwischenspeicher für die geladenen Daten

    // Funktion, um die Wunschlisten basierend auf URL-Parametern oder allen Daten zu laden
    const loadWishlists = async () => {
        const params = new URLSearchParams(window.location.search);
        const listId = params.get('list');
        
        // Konstruiere die Anfrage-URL
        const requestUrl = listId ? `${API_URL}?list=${listId}` : API_URL;

        try {
            const response = await fetch(requestUrl);
            if (!response.ok) {
                throw new Error(`Netzwerkfehler: ${response.statusText}`);
            }
            const data = await response.json();
            allData = data.wishlists;
            renderWishlists(allData);
        } catch (error) {
            wishlistsContainer.innerHTML = `<p class="error-message">Fehler beim Laden der Daten. Bitte versuche es später erneut.</p>`;
            console.error('Fehler:', error);
        }
    };

    // Funktion, um die Wunschlisten auf der Seite darzustellen
    const renderWishlists = (wishlists) => {
        wishlistsContainer.innerHTML = ''; // Leere den Container
        if (!wishlists || wishlists.length === 0) {
            wishlistsContainer.innerHTML = '<p>Keine Wunschlisten gefunden.</p>';
            return;
        }

        wishlists.forEach(list => {
            const listElement = document.createElement('section');
            listElement.className = 'wishlist';

            const shareLink = `${window.location.origin}${window.location.pathname}?list=${list.id}`;

            listElement.innerHTML = `
                <div class="wishlist-header">
                    <h2>${list.name}</h2>
                    <button class="cta-button" onclick="copyToClipboard('${shareLink}')">Liste teilen</button>
                </div>
                <div class="wishlist-cards" id="list-${list.id}">
                    ${list.wishes.length > 0 ? list.wishes.map(wish => createWishCard(wish)).join('') : '<p>Diese Liste hat noch keine Wünsche.</p>'}
                </div>
            `;
            wishlistsContainer.appendChild(listElement);
        });
    };

    // Funktion zur Erstellung einer einzelnen Wunsch-Karte
    const createWishCard = (wish) => {
        const placeholderImage = 'https://via.placeholder.com/300x180/1c1934/00dffc?text=Quantum+Image';
        return `
            <div class="wish-card ${wish.isFulfilled ? 'fulfilled' : ''}">
                <img src="${wish.imageUrl || placeholderImage}" alt="${wish.title}" class="wish-card-image">
                <div class="wish-card-content">
                    <h3>${wish.title}</h3>
                    <div class="wish-card-meta">
                        <span>Preis: ${wish.price ? `€${wish.price.toFixed(2)}` : 'N/A'}</span>
                        <span class="priority-${wish.priority}">Priorität: ${wish.priority}</span>
                    </div>
                    <p class="wish-card-description">${wish.description || 'Keine Beschreibung.'}</p>
                    <div class="wish-card-footer">
                        ${wish.link ? `<a href="${wish.link}" target="_blank" class="cta-button">Ansehen</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    };
    
    // Sortierfunktion
    const sortWishes = (criteria) => {
        let sortedData = JSON.parse(JSON.stringify(allData)); // Tiefe Kopie
        sortedData.forEach(list => {
            list.wishes.sort((a, b) => {
                switch (criteria) {
                    case 'priority-desc': return b.priority - a.priority;
                    case 'priority-asc': return a.priority - b.priority;
                    case 'price-desc': return (b.price || 0) - (a.price || 0);
                    case 'price-asc': return (a.price || 0) - (b.price || 0);
                    default: return 0;
                }
            });
        });
        renderWishlists(sortedData);
    };

    sortFilter.addEventListener('change', (e) => sortWishes(e.target.value));

    // Lade die Daten beim Start
    loadWishlists();
});

// Hilfsfunktion zum Kopieren des Links in die Zwischenablage
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Sharing-Link wurde in die Zwischenablage kopiert!');
    }, (err) => {
        console.error('Fehler beim Kopieren: ', err);
    });
}