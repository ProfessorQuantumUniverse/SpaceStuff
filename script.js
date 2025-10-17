// Konfiguration
// WICHTIG: Ersetze diese URL durch deine eigene Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbwTo-adYNFp-jNQ4IBbPK-ZtTlErj_WMDFDSuUdsz94MDqnbpNYUdIVZsDDDWz4cwOtpg/exec';

document.addEventListener('DOMContentLoaded', () => {
    const wishlistsContainer = document.getElementById('wishlists-container');
    const sortFilter = document.getElementById('sort-filter');
    const toastEl = document.getElementById('toast');

    // Share modal elements
    const shareModal = document.getElementById('share-modal');
    const shareModalClose = document.getElementById('share-modal-close');
    const shareSort = document.getElementById('share-sort');
    const shareHideFulfilled = document.getElementById('share-hide-fulfilled');
    const shareHidePrice = document.getElementById('share-hide-price');
    const shareHideDesc = document.getElementById('share-hide-desc');
    const shareLinkInput = document.getElementById('share-link');
    const shareCopyBtn = document.getElementById('share-copy');
    const shareSystemBtn = document.getElementById('share-system');
    const shareQrImg = document.getElementById('share-qr');

    let allData = []; // Zwischenspeicher für die geladenen Daten
    let currentShareListId = null;

    // URL-Parameter lesen (unterstützt list=ID oder lists=a,b,c)
    const params = new URLSearchParams(window.location.search);
    const listParam = params.get('list');
    const listsParam = params.get('lists');
    const listIds = listsParam ? listsParam.split(',').map(s => s.trim()).filter(Boolean)
                  : (listParam ? [listParam] : null);

    const urlSort = params.get('sort') || 'default';
    const urlHideFulfilled = params.get('hideFulfilled') === '1';
    const urlHidePrice = params.get('hidePrice') === '1';
    const urlHideDesc = params.get('hideDesc') === '1';

    // Falls sort= über URL ankommt, im UI spiegeln
    const sortOptions = new Set(['default','priority-desc','priority-asc','price-desc','price-asc']);
    if (sortOptions.has(urlSort)) {
        sortFilter.value = urlSort;
    }

    // Funktion, um die Wunschlisten basierend auf URL-Parametern oder allen Daten zu laden
    const loadWishlists = async () => {
        // Wenn genau eine Liste angefordert wird, kann die API gezielt angesprochen werden
        const canUseSingleEndpoint = listIds && listIds.length === 1;
        const requestUrl = canUseSingleEndpoint ? `${API_URL}?list=${encodeURIComponent(listIds[0])}` : API_URL;

        try {
            const response = await fetch(requestUrl);
            if (!response.ok) {
                throw new Error(`Netzwerkfehler: ${response.statusText}`);
            }
            const data = await response.json();
            allData = data.wishlists || [];

            // Wenn mehrere IDs gefiltert werden sollen (oder eine, aber API lieferte alle), filtern wir clientseitig
            let toRender = Array.isArray(allData) ? allData.slice() : [];
            if (listIds && listIds.length > 0 && !canUseSingleEndpoint) {
                toRender = toRender.filter(l => listIds.includes(String(l.id)));
            }

            // Sortier-/Filter-Optionen aus URL anwenden
            const opts = {
                hideFulfilled: urlHideFulfilled,
                hidePrice: urlHidePrice,
                hideDesc: urlHideDesc
            };

            // Wenn ein sort-Param gesetzt ist, initial sortieren
            if (urlSort && urlSort !== 'default') {
                toRender = sortData(toRender, urlSort);
            }

            renderWishlists(toRender, opts);
        } catch (error) {
            wishlistsContainer.innerHTML = `<p class="error-message">Fehler beim Laden der Daten. Bitte versuche es später erneut.</p>`;
            console.error('Fehler:', error);
        }
    };

    // Tiefe Kopie + Sortierung anwenden
    const sortData = (data, criteria) => {
        let sortedData = JSON.parse(JSON.stringify(data));
        sortedData.forEach(list => {
            list.wishes = (list.wishes || []).sort((a, b) => {
                switch (criteria) {
                    case 'priority-desc': return (b.priority || 0) - (a.priority || 0);
                    case 'priority-asc': return (a.priority || 0) - (b.priority || 0);
                    case 'price-desc': return (b.price || 0) - (a.price || 0);
                    case 'price-asc': return (a.price || 0) - (b.price || 0);
                    default: return 0;
                }
            });
        });
        return sortedData;
    };

    // Funktion, um die Wunschlisten auf der Seite darzustellen
    const renderWishlists = (wishlists, options = {}) => {
        const { hideFulfilled = false, hidePrice = false, hideDesc = false } = options;

        wishlistsContainer.innerHTML = '';
        if (!wishlists || wishlists.length === 0) {
            wishlistsContainer.innerHTML = '<p>Keine Wunschlisten gefunden.</p>';
            return;
        }

        wishlists.forEach(list => {
            const listElement = document.createElement('section');
            listElement.className = 'wishlist';

            listElement.innerHTML = `
                <div class="wishlist-header">
                    <h2>${list.name}</h2>
                    <div class="wishlist-actions">
                        <button class="cta-button" data-action="share" data-list-id="${list.id}">Liste teilen</button>
                    </div>
                </div>
                <div class="wishlist-cards" id="list-${list.id}">
                    ${renderWishes(list.wishes || [], { hideFulfilled, hidePrice, hideDesc })}
                </div>
            `;
            wishlistsContainer.appendChild(listElement);
        });
    };

    const renderWishes = (wishes, options = {}) => {
        const { hideFulfilled, hidePrice, hideDesc } = options;
        const filtered = hideFulfilled ? (wishes || []).filter(w => !w.isFulfilled) : (wishes || []);
        if (filtered.length === 0) {
            return '<p>Diese Liste hat keine passenden Wünsche.</p>';
        }
        return filtered.map(wish => createWishCard(wish, { hidePrice, hideDesc })).join('');
    };

    // Funktion zur Erstellung einer einzelnen Wunsch-Karte
    const createWishCard = (wish, options = {}) => {
        const { hidePrice = false, hideDesc = false } = options;
        const placeholderImage = 'https://via.placeholder.com/300x180/1c1934/00dffc?text=Quantum+Image';
        const priceText = hidePrice ? '—' : (wish.price ? `€${Number(wish.price).toFixed(2)}` : 'N/A');
        const description = hideDesc ? '' : (wish.description || 'Keine Beschreibung.');

        return `
            <div class="wish-card ${wish.isFulfilled ? 'fulfilled' : ''}">
                <img src="${wish.imageUrl || placeholderImage}" alt="${escapeHtml(wish.title)}" class="wish-card-image">
                <div class="wish-card-content">
                    <h3>${escapeHtml(wish.title)}</h3>
                    <div class="wish-card-meta">
                        <span>Preis: ${priceText}</span>
                        <span class="priority-${wish.priority}">Priorität: ${wish.priority}</span>
                    </div>
                    ${hideDesc ? '' : `<p class="wish-card-description">${escapeHtml(description)}</p>`}
                    <div class="wish-card-footer">
                        ${wish.link ? `<a href="${wish.link}" target="_blank" rel="noopener" class="cta-button">Ansehen</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    };

    // Sortier-UI
    sortFilter.addEventListener('change', (e) => {
        const criteria = e.target.value;
        const opts = {
            hideFulfilled: params.get('hideFulfilled') === '1',
            hidePrice: params.get('hidePrice') === '1',
            hideDesc: params.get('hideDesc') === '1'
        };
        const base = listIds && listIds.length
            ? allData.filter(l => listIds.includes(String(l.id)))
            : allData;
        const toRender = criteria === 'default' ? base : sortData(base, criteria);
        renderWishlists(toRender, opts);
        // URL im Browser optional aktualisieren (ohne Reload)
        const u = new URL(window.location.href);
        if (criteria === 'default') u.searchParams.delete('sort');
        else u.searchParams.set('sort', criteria);
        window.history.replaceState({}, '', u);
    });

    // Delegation: Share-Button klicken
    wishlistsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action="share"]');
        if (!btn) return;
        const listId = btn.getAttribute('data-list-id');
        openShareModal(listId);
    });

    // Share modal handling
    function openShareModal(listId) {
        currentShareListId = String(listId);
        // Defaults aus aktueller URL übernehmen
        shareSort.value = params.get('sort') || 'default';
        shareHideFulfilled.checked = params.get('hideFulfilled') === '1';
        shareHidePrice.checked = params.get('hidePrice') === '1';
        shareHideDesc.checked = params.get('hideDesc') === '1';

        updateSharePreview();
        shareModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeShareModal() {
        shareModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    shareModalClose?.addEventListener('click', closeShareModal);
    shareModal?.addEventListener('click', (e) => {
        if (e.target === shareModal) closeShareModal();
    });

    [shareSort, shareHideFulfilled, shareHidePrice, shareHideDesc].forEach(el => {
        el?.addEventListener('change', updateSharePreview);
    });

    shareCopyBtn?.addEventListener('click', () => {
        const text = shareLinkInput.value;
        copyToClipboard(text);
    });

    shareSystemBtn?.addEventListener('click', async () => {
        const text = shareLinkInput.value;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Wunschliste', url: text });
            } catch (e) {
                // Abgebrochen oder Fehler -> fallback kopieren
                copyToClipboard(text);
            }
        } else {
            copyToClipboard(text);
        }
    });

    function updateSharePreview() {
        const u = new URL(window.location.href);
        // Immer eine einzelne Liste teilen
        u.searchParams.delete('lists');
        u.searchParams.set('list', currentShareListId);

        const selSort = shareSort.value;
        if (selSort && selSort !== 'default') u.searchParams.set('sort', selSort);
        else u.searchParams.delete('sort');

        u.searchParams.toggle?.('hideFulfilled', shareHideFulfilled.checked); // Safari hat toggle nicht
        // Fallback:
        setFlag(u, 'hideFulfilled', shareHideFulfilled.checked);
        setFlag(u, 'hidePrice', shareHidePrice.checked);
        setFlag(u, 'hideDesc', shareHideDesc.checked);

        const finalUrl = u.toString();
        shareLinkInput.value = finalUrl;

        // QR-Code über externen Generator (leichtgewichtig)
        const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(finalUrl);
        shareQrImg.src = qrUrl;
    }

    function setFlag(urlObj, key, on) {
        if (on) urlObj.searchParams.set(key, '1');
        else urlObj.searchParams.delete(key);
    }

    // Lade die Daten beim Start
    loadWishlists();

    // Hilfsfunktion zum Kopieren des Links in die Zwischenablage (mit Toast)
    window.copyToClipboard = function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Link kopiert!');
        }, (err) => {
            console.error('Fehler beim Kopieren: ', err);
            showToast('Kopieren fehlgeschlagen', true);
        });
    };

    function showToast(message, isError = false) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.toggle('error', !!isError);
        toastEl.classList.remove('hidden');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => {
            toastEl.classList.add('hidden');
        }, 2200);
    }

    // Minimaler HTML-Escape
    function escapeHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, s => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[s]));
    }
})();