
const shelf = document.getElementById('main-shelf');
const searchInput = document.getElementById('searchInput');

let myPersonalLibrary = JSON.parse(localStorage.getItem('savedBooks')) || [];

//OpenLibrary API
renderPersonalShelf();

async function searchBooks() {
    const query = searchInput.value.trim();
    if (!query) return;

    const resultsGrid = document.getElementById('results-grid');
    const resultsSection = document.getElementById('search-results-section');

    // Searching
    resultsGrid.innerHTML = '<p class="loading-text">Searching...</p>';
    resultsSection.style.display = 'block';

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=10`);
        const data = await response.json();
        const foundBooks = data.docs;

        resultsGrid.innerHTML = ''; // Изчиства "Searching..."

        if (foundBooks.length === 0) {
            resultsGrid.innerHTML = '<p class="no-results">No books found.</p>';
            return;
        }

        // Рендерира резултатите
        foundBooks.forEach(book => {
            if (book.cover_i) {
                const authorName = book.author_name ? book.author_name[0] : "Unknown Author";
                const safeTitle = book.title.replace(/'/g, "\\'");
                const safeAuthor = authorName.replace(/'/g, "\\'");

                const bookCard = document.createElement('div');
                bookCard.className = 'search-item';
                bookCard.innerHTML = `
                    <img src="https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg" alt="cover" />
                    <p>${book.title}</p>
                    <button onclick="addToMyLibrary('${book.cover_i}', '${safeTitle}', '${safeAuthor}')">Add +</button>
                `;
                resultsGrid.appendChild(bookCard);
            }
        });
    } catch (err) {
        console.error("Еrror while searching:", err);
        showToast("Connection error. Try again.", true);
    }
}

function addToMyLibrary(coverId, title, author){
if(myPersonalLibrary.some(b => b.id === coverId)){
    showToast("You already have this book in your library.", true);
        return;
}
const newBook = {
    id: coverId,
    title: title,
    author: author || "Unknown Author",
    isRead: false
}
myPersonalLibrary.push(newBook);
saveToLocalStorage();
renderPersonalShelf();

showToast(`"${title}" is added!`);
}

function openModal(bookId) {
    const book = myPersonalLibrary.find(b => b.id === bookId);
    const modal = document.getElementById('book-modal');
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
        <img src="https://covers.openlibrary.org/b/id/${book.id}-M.jpg" class="modal-img">
        <h2>${book.title}</h2>
        <p><strong>Author:</strong> ${book.author || "Unknown"}</p>
        <button onclick="toggleReadStatus('${book.id}')" class="status-btn">
            ${book.isRead ? 'Marks as unread' : 'Marks as read'}
        </button>
    `;

    modal.style.display = "flex";
    
    // Затваряне X
    document.querySelector('.close-modal').onclick = () => {
        document.getElementById('book-modal').style.display = "none";
}

};
function renderPersonalShelf() {
    const container = document.getElementById('dynamic-shelves-container');
    container.innerHTML = ''; // Чисти всичко преди пренареждане

    const booksPerRow = 7;
    
    for (let i = 0; i < myPersonalLibrary.length; i += booksPerRow) {
        const currentBatch = myPersonalLibrary.slice(i, i + booksPerRow);

        const shelfDiv = document.createElement('div');
        shelfDiv.className = 'shelf';
        const bookRow = document.createElement('div');
        bookRow.className = 'book-row';

        currentBatch.forEach((book) => {
    const bookWrapper = document.createElement('div');
    bookWrapper.className = 'book-container'; 

    bookWrapper.innerHTML = `
    <div class="delete-btn" onclick="event.stopPropagation(); removeFromLibrary('${book.id}')">×</div>
    
    <div class="book ${book.isRead ? 'is-read' : ''}" onclick="openModal('${book.id}')">
        <div class="back"></div>
        <div class="page6"></div>
        <div class="page5"></div>
        <div class="page4"></div>
        <div class="page3"></div>
        <div class="page2"></div>
        <div class="page1"></div>
        <div class="front" style="background-image: url(https://covers.openlibrary.org/b/id/${book.id}-M.jpg)">
        </div>
    </div>
`;
    bookRow.appendChild(bookWrapper);
});
        const board = document.createElement('div');
        board.className = 'shelf-board';

        shelfDiv.appendChild(bookRow);
        shelfDiv.appendChild(board);
        container.appendChild(shelfDiv);
    }

    updateStats();
}

function saveToLocalStorage() {
    localStorage.setItem('savedBooks', JSON.stringify(myPersonalLibrary));
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    
    if (isError) {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }

    toast.classList.add('show');

    // Скрива 3 сек.
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function removeFromLibrary(id) {
    myPersonalLibrary = myPersonalLibrary.filter(book => book.id !== id);
    
    saveToLocalStorage();
    
    renderPersonalShelf();
    
    showToast("The book has been removed from the list", true);
}

//Прочетена/Непрочетена
function toggleReadStatus(bookId) {
    const book = myPersonalLibrary.find(b => b.id === bookId);
    if (book) {
        book.isRead = !book.isRead;
        saveToLocalStorage();
        renderPersonalShelf();
        
        document.getElementById('book-modal').style.display = "none"; 
        showToast(book.isRead ? "Congrats! You read another book!" : "Returned to your list.");
    }
}

function updateStats() {
    const total = myPersonalLibrary.length;
    
    const readCount = myPersonalLibrary.filter(book => book.isRead).length;
    
    const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;

    // Обновяваме текста на екрана
    document.getElementById('total-books').innerText = total;
    document.getElementById('read-books').innerText = readCount;
    document.getElementById('progress-percent').innerText = percent + '%';
}

let debounceTimer;

const Input = document.getElementById('searchInput');

Input.addEventListener('input', () => {
    clearTimeout(debounceTimer);

    const query = Input.value.trim();

    if (query.length < 1) {
        return;
    }

    debounceTimer = setTimeout(() => {
        searchBooks(query);
    }, 600);
});

const clearSearchBtn = document.getElementById('clearSearchBtn');

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        
        const resultsSection = document.getElementById('search-results-section');
        const resultsGrid = document.getElementById('results-grid');
        
        if (resultsSection) resultsSection.style.display = 'none';
        if (resultsGrid) resultsGrid.innerHTML = '';
        
        searchInput.focus();
    });
}
//----------------------------бележки
let notesArchive = JSON.parse(localStorage.getItem('my_notes_list')) || [];

const saveBtn = document.getElementById('save-note-btn');
const noteInput = document.getElementById('new-note-text');
const archiveModal = document.getElementById('archive-modal');
const archiveList = document.getElementById('notes-archive-list');
const viewBtn = document.getElementById('view-archive-btn');
const closeBtn = document.getElementById('close-archive');

function renderArchive() {
    archiveList.innerHTML = ""; 
    
    if (notesArchive.length === 0) {
        archiveList.innerHTML = "<p style='text-align:center; color:#888;'>List is empty.</p>";
        return;
    }

    notesArchive.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'archived-note';
        noteDiv.innerHTML = `
            <div class="note-content-text" 
                 contenteditable="true" 
                 onblur="editNote(${index}, this.innerText)">${note.text}</div>
            <span class="note-date">${note.date}</span>
            <button class="delete-btn" onclick="deleteNote(${index})">&times;</button>
        `;
        archiveList.appendChild(noteDiv);
    });
}

saveBtn.addEventListener('click', () => {
    const text = noteInput.innerText.trim();
    if (text !== "") {
        const newEntry = {
            text: text,
            date: new Date().toLocaleString('bg-BG')
        };
        notesArchive.push(newEntry);
        localStorage.setItem('my_notes_list', JSON.stringify(notesArchive));
        noteInput.innerText = "";
        showToast("The note is added to the list.", false);
    }
});

viewBtn.onclick = () => {
    renderArchive();
    archiveModal.style.display = "flex";
}

closeBtn.onclick = () => archiveModal.style.display = "none";

window.deleteNote = function(index) {
        showToast("You successfully deleted the note.", true);
        notesArchive.splice(index, 1);
        localStorage.setItem('my_notes_list', JSON.stringify(notesArchive));
        renderArchive();
    
}

window.editNote = function(index, newText) {
    if (newText.trim() === "") {
        showToast("The note could not be empty!", true);
        renderArchive(); 
        return;
    }

    notesArchive[index].text = newText;
    
    localStorage.setItem('my_notes_list', JSON.stringify(notesArchive));
    
    showToast("The change is apply!", false);
};
