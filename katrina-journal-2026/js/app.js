// ==================== SMOOTH SCROLLING FOR SIDEBAR NAV ====================
document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const targetId = this.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== JOURNAL SAVE FUNCTIONALITY ====================
const saveJournalBtn = document.getElementById('saveJournalBtn');
const journalDate = document.getElementById('journalDate');
const journalTitle = document.querySelector('[data-field="title"]');
const journalEntry = document.querySelector('[data-field="entry"]');
const journalImage = document.getElementById('journalImage');
const journalImagePreview = document.getElementById('journalImagePreview');
let journalImageData = null;

// Hide button initially
saveJournalBtn.style.display = 'none';

// Handle image upload
journalImage.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Image too large! Please use an image smaller than 2MB.');
            journalImage.value = '';
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            journalImage.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            journalImageData = event.target.result;
            const img = document.createElement('img');
            img.src = journalImageData;
            journalImagePreview.innerHTML = '';
            journalImagePreview.appendChild(img);
            journalImagePreview.style.display = 'block';
            checkJournalInput();
        };
        reader.onerror = function () {
            alert('Failed to read the image file.');
            journalImage.value = '';
        };
        reader.readAsDataURL(file);
    }
});

// Function to check if journal has content
function checkJournalInput() {
    const hasContent = journalEntry.textContent.trim().length > 0;
    saveJournalBtn.style.display = hasContent ? 'block' : 'none';
}

// Listen for input changes
journalTitle.addEventListener('input', checkJournalInput);
journalEntry.addEventListener('input', checkJournalInput);
journalDate.addEventListener('change', checkJournalInput);

// Save journal entry
saveJournalBtn.addEventListener('click', function () {
    const title = journalTitle.textContent.trim();
    const date = journalDate.value;
    const entry = journalEntry.textContent.trim();

    if (!date) {
        alert('Kelan muna kasi?!');
        return;
    }

    if (!entry) {
        alert('Ano teh, walang laman?!');
        return;
    }

    try {
        // Save to localStorage
        const journalEntryData = {
            title: title || 'Untitled',
            date: date,
            entry: entry,
            image: journalImageData,
            timestamp: new Date().getTime()
        };

        // Get existing entries
        let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.push(journalEntryData);
        localStorage.setItem('journalEntries', JSON.stringify(entries));

        // Show success message
        alert('Journal entry saved! ✅');

        // Clear the fields
        journalTitle.textContent = '';
        journalEntry.textContent = '';
        journalDate.value = '';
        journalImage.value = '';
        journalImagePreview.innerHTML = '';
        journalImagePreview.style.display = 'none';
        journalImageData = null;

        // Hide button again
        saveJournalBtn.style.display = 'none';

        // Update calendar to show this date has an entry
        updateCalendarAfterSave(date);

        console.log('Journal entry saved for date:', date);
    } catch (error) {
        console.error('Error saving journal entry:', error);
        alert('Failed to save entry. Please try again.');
    }
});

// ==================== PLANNER SAVE FUNCTIONALITY ====================
const plannerGrid = document.getElementById('plannerGrid');
const plannerPrevBtn = document.getElementById('plannerPrevBtn');
const plannerNextBtn = document.getElementById('plannerNextBtn');
const plannerPageInfo = document.getElementById('plannerPageInfo');

let plannerNotes = (function () {
    try {
        return JSON.parse(localStorage.getItem('plannerNotes') || '[]');
    } catch (error) {
        console.error('Error loading planner notes:', error);
        return [];
    }
})();
let currentPlannerPage = 1;
const itemsPerPage = 10;

// Initialize planner pagination
function initializePlannerPagination() {
    // Clear existing boxes
    plannerGrid.innerHTML = '';

    // Create boxes for current page
    for (let i = 0; i < itemsPerPage; i++) {
        const globalIndex = (currentPlannerPage - 1) * itemsPerPage + i;
        const box = document.createElement('div');
        box.className = 'planner-box';
        box.setAttribute('data-box-id', globalIndex);
        box.contentEditable = 'false';

        // Load existing note if it exists
        const note = plannerNotes.find(entry => entry.boxId === globalIndex);
        if (note) {
            box.textContent = note.text;
            box.title = `Date: ${note.date}`;
        }

        // Click to open planner note form
        box.addEventListener('click', function () {
            showPlannerNoteForm(globalIndex);
        });

        plannerGrid.appendChild(box);
    }

    // Update pagination buttons
    updatePaginationButtons();
}

function updatePaginationButtons() {
    // Calculate total pages needed: minimum 1 page, or enough for all entries
    const totalEntries = plannerNotes.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));

    // Allow going to next page if not on last page, or if there's space on next page
    plannerPrevBtn.disabled = currentPlannerPage === 1;
    plannerNextBtn.disabled = currentPlannerPage > totalPages;

    plannerPageInfo.textContent = `Page ${currentPlannerPage} of ${totalPages}`;
}

plannerPrevBtn.addEventListener('click', function () {
    if (currentPlannerPage > 1) {
        currentPlannerPage--;
        initializePlannerPagination();
    }
});

plannerNextBtn.addEventListener('click', function () {
    const totalPages = Math.max(1, Math.ceil(plannerNotes.length / itemsPerPage));
    // Allow next page if there are potentially more items or if current page isn't beyond total
    if (currentPlannerPage <= totalPages) {
        currentPlannerPage++;
        initializePlannerPagination();
    }
});

// Initial setup
initializePlannerPagination();

// Show planner note form
function showPlannerNoteForm(boxId) {
    const existingForm = document.querySelector('.planner-note-form');
    if (existingForm) {
        existingForm.remove();
    }

    const note = plannerNotes.find(entry => entry.boxId === boxId);

    const form = document.createElement('div');
    form.className = 'planner-note-form';

    form.innerHTML = `
        <div class="planner-form-header">
            <h3>PLAN NOTE</h3>
            <button class="form-close-btn">×</button>
        </div>
        
        <div class="planner-form-group">
            <label>DATE:</label>
            <input type="date" class="planner-form-date" value="${note ? note.date : ''}">
        </div>
        
        <div class="planner-form-group">
            <label>TEXT:</label>
            <textarea class="planner-form-text" placeholder="Write your plan...">${note ? note.text : ''}</textarea>
        </div>
        
        <div class="planner-form-group">
            <label>IMAGE:</label>
            <input type="file" class="planner-form-image" accept="image/*">
            <div class="planner-form-image-preview"></div>
        </div>
        
        <div class="planner-form-actions">
            <button class="planner-form-save">Save</button>
            <button class="planner-form-delete">Delete</button>
        </div>
    `;

    document.body.appendChild(form);

    // Load existing image if it exists
    const imagePreview = form.querySelector('.planner-form-image-preview');
    if (note && note.image) {
        const img = document.createElement('img');
        img.src = note.image;
        imagePreview.appendChild(img);
    }

    // Handle image upload in form
    const imageInput = form.querySelector('.planner-form-image');
    imageInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 2MB)
            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                alert('Image too large! Please use an image smaller than 2MB.');
                imageInput.value = '';
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.');
                imageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                imagePreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = event.target.result;
                imagePreview.appendChild(img);
            };
            reader.onerror = function () {
                alert('Failed to read the image file.');
                imageInput.value = '';
            };
            reader.readAsDataURL(file);
        }
    });

    // Save note
    form.querySelector('.planner-form-save').addEventListener('click', function () {
        const date = form.querySelector('.planner-form-date').value;
        const text = form.querySelector('.planner-form-text').value;
        const imageData = imagePreview.querySelector('img')?.src || null;

        if (!text) {
            alert('Please add some text!');
            return;
        }

        try {
            // Remove old entry if exists
            plannerNotes = plannerNotes.filter(entry => entry.boxId !== boxId);

            // Save new entry
            plannerNotes.push({
                boxId: boxId,
                date: date,
                text: text,
                image: imageData,
                timestamp: new Date().getTime()
            });

            localStorage.setItem('plannerNotes', JSON.stringify(plannerNotes));

            // Update the planner display with pagination
            initializePlannerPagination();

            // Update calendar to show this date has a plan
            updateCalendarAfterSave(date);

            console.log('Planner note saved for date:', date);
            alert('Plan saved! ✅');
            form.remove();
        } catch (error) {
            console.error('Error saving planner note:', error);
            alert('Failed to save note. Please try again.');
        }
    });

    // Delete note
    form.querySelector('.planner-form-delete').addEventListener('click', function () {
        if (confirm('Delete this plan?')) {
            try {
                plannerNotes = plannerNotes.filter(entry => entry.boxId !== boxId);
                localStorage.setItem('plannerNotes', JSON.stringify(plannerNotes));

                // Update the planner display with pagination
                initializePlannerPagination();

                console.log('Planner note deleted');
                form.remove();
            } catch (error) {
                console.error('Error deleting planner note:', error);
                alert('Failed to delete note. Please try again.');
            }
        }
    });

    // Close form
    form.querySelector('.form-close-btn').addEventListener('click', function () {
        form.remove();
    });
}

// ==================== CALENDAR GENERATION ====================

function generateCalendar() {
    const calendarContainer = document.querySelector('.year-calendar');
    if (!calendarContainer) {
        console.error('Calendar container not found!');
        return;
    }

    try {
        // Clear existing content
        calendarContainer.innerHTML = '';

        const months = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];

        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        // Create calendar rows (4 months per row)
        for (let row = 0; row < 3; row++) {
            const calendarRow = document.createElement('div');
            calendarRow.className = 'calendar-row';

            for (let col = 0; col < 4; col++) {
                const monthIndex = row * 4 + col;
                if (monthIndex >= 12) break;

                const monthContainer = document.createElement('div');
                monthContainer.className = 'month-container';

                // Month label
                const monthLabel = document.createElement('div');
                monthLabel.className = 'month-label';
                monthLabel.textContent = months[monthIndex];
                monthContainer.appendChild(monthLabel);

                // Days container
                const daysContainer = document.createElement('div');
                daysContainer.className = 'days-container';

                // Create day boxes
                for (let day = 1; day <= daysInMonth[monthIndex]; day++) {
                    const dayBox = document.createElement('div');
                    dayBox.className = 'day-box';
                    dayBox.dataset.date = `2026-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    dayBox.dataset.day = day;
                    dayBox.textContent = day;

                    // Click event to select mood
                    dayBox.addEventListener('click', function () {
                        selectDayForMood(this);
                    });

                    daysContainer.appendChild(dayBox);
                }

                monthContainer.appendChild(daysContainer);
                calendarRow.appendChild(monthContainer);
            }

            calendarContainer.appendChild(calendarRow);
        }

        // Load saved moods and entries
        loadCalendarData();
        console.log('Calendar generated successfully');
    } catch (error) {
        console.error('Error generating calendar:', error);
    }
}

// ==================== GET ENTRIES FOR A SPECIFIC DATE ====================
function getEntriesForDate(date) {
    try {
        const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        const plannerNotes = JSON.parse(localStorage.getItem('plannerNotes') || '[]');

        const journalForDate = journalEntries.filter(entry => entry.date === date);
        const plannerNotesForDate = plannerNotes.filter(note => note.date === date);

        return {
            journal: journalForDate,
            plannerNotes: plannerNotesForDate
        };
    } catch (error) {
        console.error('Error retrieving entries for date:', error);
        return {
            journal: [],
            plannerNotes: []
        };
    }
}

// ==================== MOOD SELECTION ====================
let selectedDay = null;

function selectDayForMood(dayElement) {
    // Remove previous selection
    if (selectedDay) {
        selectedDay.classList.remove('selected');
    }

    // Select new day
    selectedDay = dayElement;
    selectedDay.classList.add('selected');

    // Show mood selector
    showMoodSelector(dayElement);
}

function showMoodSelector(dayElement) {
    const existingSelector = document.querySelector('.mood-selector-popup');
    if (existingSelector) {
        existingSelector.remove();
    }

    const date = dayElement.dataset.date;
    const entries = getEntriesForDate(date);

    // Format date for display
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const popup = document.createElement('div');
    popup.className = 'mood-selector-popup';

    let popupHTML = `
        <div class="popup-date-header">${formattedDate}</div>
    `;

    // Show journal entries if they exist
    if (entries.journal.length > 0) {
        popupHTML += `<div class="popup-section">`;
        popupHTML += `<div class="popup-section-title">📔 Journal Entries:</div>`;
        entries.journal.forEach(entry => {
            popupHTML += `
                <div class="popup-entry">
                    <div class="popup-entry-title">${entry.title}</div>
                    <div class="popup-entry-content">${entry.entry}</div>
                    ${entry.image ? `<img src="${entry.image}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 6px; margin-top: 10px;">` : ''}
                </div>
            `;
        });
        popupHTML += `</div>`;
    }

    // Show planner notes if they exist
    if (entries.plannerNotes && entries.plannerNotes.length > 0) {
        popupHTML += `<div class="popup-section">`;
        popupHTML += `<div class="popup-section-title">📌 Planner Notes:</div>`;
        entries.plannerNotes.forEach(note => {
            popupHTML += `
                <div class="popup-entry">
                    <div class="popup-entry-content">${note.text}</div>
                    ${note.image ? `<img src="${note.image}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 6px; margin-top: 8px;">` : ''}
                </div>
            `;
        });
        popupHTML += `</div>`;
    }

    // Always show mood selector
    popupHTML += `
        <div class="mood-popup-title">Anong mood mo?</div>
        <div class="mood-options">
            <button class="mood-option happy" data-mood="happy" title="Happy">
                <span>(●ˇ∀ˇ●)</span>
            </button>
            <button class="mood-option sad" data-mood="sad" title="Sad">
                <span>ಥ_ಥ</span>
            </button>
            <button class="mood-option angry" data-mood="angry" title="Angry">
                <span>ಠ╭╮ಠ</span>
            </button>
            <button class="mood-option productive" data-mood="productive" title="Productive">
                <span>( •̀ Ω •́ )✧</span>
            </button>
        </div>
        <button class="mood-clear-btn">Clear Mood</button>
        <button class="mood-close-btn">Close</button>
    `;

    popup.innerHTML = popupHTML;
    document.body.appendChild(popup);

    // Fixed positioning to center of viewport
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.zIndex = '1000';

    // Add event listeners
    popup.querySelectorAll('.mood-option').forEach(btn => {
        btn.addEventListener('click', function () {
            const mood = this.dataset.mood;
            applyMoodToDay(dayElement, mood);
            popup.remove();
        });
    });

    popup.querySelector('.mood-clear-btn').addEventListener('click', function () {
        clearMoodFromDay(dayElement);
        popup.remove();
    });

    popup.querySelector('.mood-close-btn').addEventListener('click', function () {
        popup.remove();
        if (selectedDay) {
            selectedDay.classList.remove('selected');
            selectedDay = null;
        }
    });
}

function applyMoodToDay(dayElement, mood) {
    // Remove existing mood classes
    dayElement.classList.remove('happy', 'sad', 'angry', 'productive');

    // Add new mood class
    dayElement.classList.add(mood);

    // Save to localStorage
    const date = dayElement.dataset.date;
    const moods = JSON.parse(localStorage.getItem('dayMoods') || '{}');
    moods[date] = mood;
    localStorage.setItem('dayMoods', JSON.stringify(moods));

    // Remove selection
    dayElement.classList.remove('selected');
    selectedDay = null;
}

function clearMoodFromDay(dayElement) {
    // Remove mood classes
    dayElement.classList.remove('happy', 'sad', 'angry', 'productive');

    // Remove from localStorage
    const date = dayElement.dataset.date;
    const moods = JSON.parse(localStorage.getItem('dayMoods') || '{}');
    delete moods[date];
    localStorage.setItem('dayMoods', JSON.stringify(moods));

    // Remove selection
    dayElement.classList.remove('selected');
    selectedDay = null;
}

// ==================== LOAD CALENDAR DATA ====================
function loadCalendarData() {
    try {
        // Load moods
        const moods = JSON.parse(localStorage.getItem('dayMoods') || '{}');
        Object.keys(moods).forEach(date => {
            const dayBox = document.querySelector(`[data-date="${date}"]`);
            if (dayBox) {
                dayBox.classList.add(moods[date]);
            }
        });

        // Mark days with journal entries
        const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        journalEntries.forEach(entry => {
            const dayBox = document.querySelector(`[data-date="${entry.date}"]`);
            if (dayBox) {
                dayBox.classList.add('has-journal');
            }
        });

        // Mark days with planner notes
        const plannerNotes = JSON.parse(localStorage.getItem('plannerNotes') || '[]');
        plannerNotes.forEach(note => {
            if (note.date) {
                const dayBox = document.querySelector(`[data-date="${note.date}"]`);
                if (dayBox) {
                    dayBox.classList.add('has-planner');
                }
            }
        });
    } catch (error) {
        console.error('Error loading calendar data:', error);
    }
}

// ==================== UPDATE CALENDAR AFTER SAVING ====================
function updateCalendarAfterSave(date) {
    loadCalendarData();
}

// ==================== INITIALIZE CALENDAR ON PAGE LOAD ====================
// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', generateCalendar);
} else {
    // DOM is already loaded
    generateCalendar();
}

console.log('✅ Journal app loaded successfully - All systems ready!');