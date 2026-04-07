
const shelf = document.getElementById('main-shelf');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

let myPersonalLibrary = JSON.parse(localStorage.getItem('savedBooks')) || [];

renderPersonalShelf();

async function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const response = await fetch(`https://openlibrary.org/search.json?q=${query}`);
    const data = await response.json();
    const foundBooks = data.docs.slice(0, 5);   
    const resultsGrid = document.getElementById('results-grid');

    resultsGrid.innerHTML = '<p class="loading-text">Searching...</p>';

    fetch(`https://openlibrary.org/search.json?q=${query}&limit=10`)
        .then(response => response.json())
        .catch(err => console.error("Error while searching...:", err));

    resultsGrid.style.display = 'flex';
    resultsGrid.style.justifyContent = 'center';
    resultsGrid.style.flexWrap = 'wrap'; 
    resultsGrid.style.gap = '20px';

    const resultsSection = document.getElementById('search-results-section');
    
    resultsGrid.innerHTML = '';
    resultsSection.style.display = 'block';

    foundBooks.forEach(book => {
        if (book.cover_i) {
            // 1. Вземаме първия автор от масива или пише "Unknown", ако няма такъв
        const authorName = book.author_name ? book.author_name[0] : "Unknown Author";
        
        // 2. Почистваме имената от кавички, за да не счупят HTML-а
        const safeTitle = book.title.replace(/'/g, "\\'");
        const safeAuthor = authorName.replace(/'/g, "\\'");
            const bookCard = document.createElement('div');
            bookCard.className = 'search-item';
            bookCard.innerHTML = `
            <img src="https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg" />
            <p>${book.title}</p>
            <button onclick="addToMyLibrary('${book.cover_i}', '${safeTitle}', '${safeAuthor}')">Add +</button>
        `;
            resultsGrid.appendChild(bookCard);
        }
    });
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
    container.innerHTML = ''; // Чистим всичко преди пренареждане

    const booksPerRow = 7;
    
    // Въртим цикъл през книгите със стъпка 8
    for (let i = 0; i < myPersonalLibrary.length; i += booksPerRow) {
        // Вземаме "парче" от масива (от i до i+8)
        const currentBatch = myPersonalLibrary.slice(i, i + booksPerRow);

        // 1. Създаваме обвивката на новия рафт
        const shelfDiv = document.createElement('div');
        shelfDiv.className = 'shelf';

        // 2. Създаваме реда за книгите
        const bookRow = document.createElement('div');
        bookRow.className = 'book-row';

        // Пълним реда с книгите от текущото "парче"
        currentBatch.forEach((book) => {
    const bookWrapper = document.createElement('div');
    bookWrapper.className = 'book-container'; // Обвивка за мащаба

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
        // 3. Създаваме дървената дъска (визуалния елемент)
        const board = document.createElement('div');
        board.className = 'shelf-board';

        // Сглобяваме всичко
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

    // Скрива след 3 сек.
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

// Функция за смяна на статуса (Прочетена/Непрочетена) вътре в модала
function toggleReadStatus(bookId) {
    const book = myPersonalLibrary.find(b => b.id === bookId);
    if (book) {
        book.isRead = !book.isRead;
        saveToLocalStorage();
        renderPersonalShelf();
        
        // Затваряме модала и показваме съобщение
        document.getElementById('book-modal').style.display = "flex";
        showToast(book.isRead ? "Congrats! You read another book!" : "The book is returned in your list.");
    }
}

// Затваряне на модала при клик извън него (много "smart" функционалност)
window.onclick = function(event) {
    const modal = document.getElementById('book-modal');
    if (event.target == modal) {
        modal.style.display = "flex";
    }
}

function updateStats() {
    const total = myPersonalLibrary.length;
    // Филтрираме само тези, които имат isRead: true
    const readCount = myPersonalLibrary.filter(book => book.isRead).length;
    
    // Изчисляваме процента (внимаваме за делене на 0)
    const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;

    // Обновяваме текста на екрана
    document.getElementById('total-books').innerText = total;
    document.getElementById('read-books').innerText = readCount;
    document.getElementById('progress-percent').innerText = percent + '%';
}

//live search timer

let debounceTimer;

// Намираме полето за търсене
const Input = document.getElementById('searchInput');

// Слушаме за всяко пускане на клавиш (keyup)
Input.addEventListener('input', () => {
    // 1. Чистим таймера от предишното натискане
    clearTimeout(debounceTimer);

    // 2. Вземаме текста и проверяваме дали не е твърде кратък
    const query = Input.value.trim();

    if (query.length < 3) {
        // Ако е под 3 символа, не правим нищо (или чистим резултатите)
        return;
    }

    // 3. Задаваме нов таймер (например 600ms изчакване)
    debounceTimer = setTimeout(() => {
        searchBooks(query); // Викаме съществуващата ти функция за търсене
    }, 600);
});

const clearSearchBtn = document.getElementById('clearSearchBtn');

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        //  Изчистваме текста в полето
        searchInput.value = '';
        
        //  Скриваме секцията с резултатите
        const resultsSection = document.getElementById('search-results-section');
        const resultsGrid = document.getElementById('results-grid');
        
        if (resultsSection) resultsSection.style.display = 'flex';
        if (resultsGrid) resultsGrid.innerHTML = '';
        
        // Връщаме фокуса върху полето
        searchInput.focus();
    });
}


/*свързване на бутона с бележки - списък */

// 1. Инициализиране на данните
let notesArchive = JSON.parse(localStorage.getItem('my_notes_list')) || [];

// Елементи
const saveBtn = document.getElementById('save-note-btn');
const noteInput = document.getElementById('new-note-text');
const archiveModal = document.getElementById('archive-modal');
const archiveList = document.getElementById('notes-archive-list');
const viewBtn = document.getElementById('view-archive-btn');
const closeBtn = document.getElementById('close-archive');

// Функция за показване на архива
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

// Добавяне на нова бележка
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

// Контрол на модала
viewBtn.onclick = () => {
    renderArchive();
    archiveModal.style.display = "flex";
}

closeBtn.onclick = () => archiveModal.style.display = "none";

// Изтриване на бележка
window.deleteNote = function(index) {
        showToast("You successfully deleted the note.", true);
        notesArchive.splice(index, 1);
        localStorage.setItem('my_notes_list', JSON.stringify(notesArchive));
        renderArchive();
    
}

window.editNote = function(index, newText) {
    // Проверяваме дали текстът не е празен
    if (newText.trim() === "") {
        showToast("The note could not be empty!", true);
        renderArchive(); // Връщаме стария текст, ако потребителят изтрие всичко
        return;
    }

    // Обновяваме текста в масива
    notesArchive[index].text = newText;
    
    // Запазваме в LocalStorage
    localStorage.setItem('my_notes_list', JSON.stringify(notesArchive));
    
    // Показваме Toast съобщение за успех
    showToast("The change is apply!");
};
