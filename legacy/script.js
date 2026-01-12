document.addEventListener('DOMContentLoaded', initialize);

const API_BASE_URL = 'http://localhost:8900';

// --- STATE ---
let allWorkouts = [];
let uniqueExercises = [];
let progressChart = null;
let currentRoutine = null;
let currentRoutineDay = null;
let suggestedWorkout = null;
let currentActiveExerciseIndex = 0;

// --- DOM ELEMENTS ---
const loadingView = document.getElementById('loading-view');
const workoutsListView = document.getElementById('workouts-list-view');
const logDetailView = document.getElementById('log-detail-view');
const exerciseProgressView = document.getElementById('exercise-progress-view');
const exerciseDetailView = document.getElementById('exercise-detail-view');
const monthlyReportView = document.getElementById('monthly-report-view');
// const logWorkoutView = document.getElementById('log-workout-view'); // Removed

const homeButton = document.getElementById('home-button');
const progressButton = document.getElementById('progress-button');
const monthlyReportButton = document.getElementById('monthly-report-button');
const startWorkoutButton = document.getElementById('start-workout-button');
const activeWorkoutView = document.getElementById('active-workout-view');
const finishWorkoutButton = document.getElementById('finish-workout-button');
const addActiveExerciseButton = document.getElementById('add-active-exercise-button');
const activeExercisesContainer = document.getElementById('active-exercises-container');
const activeTimer = document.getElementById('active-timer');

const exerciseSelectionModal = document.getElementById('exercise-selection-modal');
const exerciseSearch = document.getElementById('exercise-search');
const modalExerciseList = document.getElementById('modal-exercise-list');
const closeModalButton = document.getElementById('close-modal-button');

const headerTitle = document.getElementById('header-title');
const workoutsContainer = document.getElementById('workouts-container');
const logTitle = document.getElementById('log-title');
const logExerciseContainer = document.getElementById('log-exercise-container');
const exerciseListContainer = document.getElementById('exercise-list-container');
const exerciseTitle = document.getElementById('exercise-title');
const chartCanvas = document.getElementById('progress-chart');
const monthlyReportTitle = document.getElementById('monthly-report-title');
const monthlyReportContainer = document.getElementById('monthly-report-container');
const monthSelect = document.getElementById('month-select');
const muscleGroupProgressView = document.getElementById('muscle-group-progress-view');
const backToProgressFromMuscleGroupButton = document.getElementById('back-to-progress-from-muscle-group-button');
const muscleGroupSelect = document.getElementById('muscle-group-select');
const muscleGroupChart = document.getElementById('muscle-group-chart');
const muscleGroupProgressButton = document.getElementById('muscle-group-progress-button');
const backToHomeButton = document.getElementById('back-to-home-button');
const backToProgressButton = document.getElementById('back-to-progress-button');
const backToProgressFromReportButton = document.getElementById('back-to-progress-from-report-button');

const routinesButton = document.getElementById('routines-button');
const routinesListView = document.getElementById('routines-list-view');
const routinesContainer = document.getElementById('routines-container');
const createRoutineButton = document.getElementById('create-routine-button');
const routineDetailView = document.getElementById('routine-detail-view');
const routineDetailTitle = document.getElementById('routine-detail-title');
const routineDaysContainer = document.getElementById('routine-days-container');
const addRoutineDayButton = document.getElementById('add-routine-day-button');
const backToRoutinesButton = document.getElementById('back-to-routines-button');
const routineDayView = document.getElementById('routine-day-view');
const routineDayTitle = document.getElementById('routine-day-title');
const routineDayExercisesContainer = document.getElementById('routine-day-exercises-container');
const addExerciseToDayButton = document.getElementById('add-exercise-to-day-button');
const backToRoutineDetailButton = document.getElementById('back-to-routine-detail-button');
const suggestedWorkoutContainer = document.getElementById('suggested-workout-container');
const suggestedWorkoutTitle = document.getElementById('suggested-workout-title');
const suggestedExercisesList = document.getElementById('suggested-exercises-list');
const startSuggestedWorkoutButton = document.getElementById('start-suggested-workout-button');
const daySelectionModal = document.getElementById('day-selection-modal');
const closeDayModalButton = document.getElementById('close-day-modal-button');
const dayOptions = document.querySelectorAll('.day-option');

const prevExerciseBtn = document.getElementById('prev-exercise-btn');
const nextExerciseBtn = document.getElementById('next-exercise-btn');
const activeWorkoutProgress = document.getElementById('active-workout-progress');


function initialize() {
    showView('loading');
    headerTitle.textContent = "Logged Workouts";

    fetch(`${API_BASE_URL}/workouts/`)
        .then(response => response.json())
        .then(data => {
            allWorkouts = data.sort((a, b) => new Date(b.date) - new Date(a.date));
            // Fetch exercises to get names for the UI since workouts only have IDs now (assuming backend structure)
            // For this iteration, we might need to adjust how we get exercise names if the backend returns IDs.
            // Let's assume for now we need to fetch exercises too.
            return fetch(`${API_BASE_URL}/exercises/`);
        })
        .then(response => response.json())
        .then(exercisesData => {
            // Map exercise IDs to names for easier lookup
            window.exercisesMap = {};
            exercisesData.forEach(ex => window.exercisesMap[ex.id] = ex);

            // We need to hydrate the workouts with exercise details if the backend returns IDs
            // But wait, the previous frontend code expected a specific JSON structure.
            // The new backend returns a relational structure. We need to adapt the frontend to understand it.
            // For the sake of this task, let's focus on the ACTIVE logging part first.
            // We will need a way to get the full workout details including exercises and sets.
            // The current backend has /workouts/ but it returns the Workout model which doesn't include exercises.
            // We might need to fetch them separately or update the backend.
            // For now, let's just get the list of exercises for the active logger.

            uniqueExercises = exercisesData.map(ex => ex.name).sort();

            renderWorkoutDates(groupWorkoutsByMonth(allWorkouts));
            renderExerciseList(uniqueExercises);

            // Fetch suggested workout
            return fetch(`${API_BASE_URL}/workouts/suggested`);
        })
        .then(response => response.json())
        .then(data => {
            if (data) {
                suggestedWorkout = data;
                renderSuggestedWorkout(data);
            }
            showView('workouts-list');
        })
        .catch(error => {
            console.error('Error loading data:', error);
            onFailure(error);
        });

    // Navigation event listeners
    homeButton.addEventListener('click', () => showView('workouts-list'));
    progressButton.addEventListener('click', () => showView('exercise-progress'));

    startWorkoutButton.addEventListener('click', startActiveWorkout);
    finishWorkoutButton.addEventListener('click', finishActiveWorkout);
    addActiveExerciseButton.addEventListener('click', openExerciseModal);
    closeModalButton.addEventListener('click', () => exerciseSelectionModal.classList.add('hidden'));

    exerciseSearch.addEventListener('input', (e) => filterExerciseList(e.target.value));

    monthlyReportButton.addEventListener('click', () => {
        // ... (keep existing logic if possible, or disable for now)
        showView('monthly-report');
    });
    backToHomeButton.addEventListener('click', () => showView('workouts-list'));
    backToProgressButton.addEventListener('click', () => showView('exercise-progress'));
    backToProgressFromReportButton.addEventListener('click', () => showView('exercise-progress'));

    // Removed logWorkoutForm listeners as we are using active logging now

    muscleGroupProgressButton.addEventListener('click', () => {
        showView('muscle-group-progress');
        muscleGroupSelect.dispatchEvent(new Event('change'));
    });
    backToProgressFromMuscleGroupButton.addEventListener('click', () => showView('exercise-progress'));

    monthSelect.addEventListener('change', () => {
        const selectedMonth = monthSelect.value;
        const reportData = generateMonthlyReport(selectedMonth, allWorkouts);
        renderMonthlyReport(reportData);
    });

    muscleGroupSelect.addEventListener('change', () => {
        const selectedMuscleGroup = muscleGroupSelect.value;
        const data = getMuscleGroupFrequency(selectedMuscleGroup, allWorkouts);
        renderMuscleGroupChart(data, selectedMuscleGroup);
    });

    // Routine Event Listeners
    routinesButton.addEventListener('click', () => {
        fetchRoutines();
        showView('routines-list');
    });

    createRoutineButton.addEventListener('click', createRoutine);
    backToRoutinesButton.addEventListener('click', () => showView('routines-list'));

    addRoutineDayButton.addEventListener('click', () => {
        daySelectionModal.classList.remove('hidden');
    });

    closeDayModalButton.addEventListener('click', () => daySelectionModal.classList.add('hidden'));

    dayOptions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dayOfWeek = parseInt(e.target.dataset.day);
            addDayToRoutine(dayOfWeek);
            daySelectionModal.classList.add('hidden');
        });
    });

    backToRoutineDetailButton.addEventListener('click', () => showView('routine-detail'));

    addExerciseToDayButton.addEventListener('click', () => {
        // Reuse exercise modal but set a flag or callback
        window.onExerciseSelected = (exerciseId) => {
            addExerciseToRoutineDay(exerciseId);
            exerciseSelectionModal.classList.add('hidden');
        };
        exerciseSelectionModal.classList.remove('hidden');
    });

    startSuggestedWorkoutButton.addEventListener('click', () => {
        if (suggestedWorkout) {
            startActiveWorkout(suggestedWorkout.exercises);
        }
    });

    prevExerciseBtn.addEventListener('click', () => navigateActiveExercise(-1));
    nextExerciseBtn.addEventListener('click', () => navigateActiveExercise(1));
}

// --- DATA PROCESSING ---
function getUniqueExercises(workouts) {
    const exerciseNames = new Set();
    workouts.forEach(workout => {
        workout.exercises.forEach(item => {
            if (item.superset) {
                item.superset.forEach(ex => exerciseNames.add(ex.name));
            } else {
                exerciseNames.add(item.name);
            }
        });
    });
    return [...exerciseNames].sort();
}

function groupWorkoutsByMonth(workouts) {
    return workouts.reduce((acc, workout) => {
        const date = new Date(workout.date);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        const key = `${year}-${month}`;

        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(workout);
        return acc;
    }, {});
}

function getLatestMonth(workouts) {
    if (workouts.length === 0) {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        return `${year}-${month}`;
    }

    const latestWorkout = workouts[workouts.length - 1];
    const date = new Date(latestWorkout.date);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    return `${year}-${month}`;
}

function generateMonthlyReport(month, workouts) {
    const [year, monthName] = month.split('-');
    const monthlyWorkouts = workouts.filter(workout => {
        const date = new Date(workout.date);
        return date.getFullYear() == year && date.toLocaleString('default', { month: 'long' }) === monthName;
    });

    const exerciseNames = new Set();
    const muscleGroupCounts = {};
    let totalSets = 0;
    let totalReps = 0;

    monthlyWorkouts.forEach(workout => {
        workout.exercises.forEach(item => {
            const processExercise = (ex) => {
                exerciseNames.add(ex.name);
                if (ex.muscle_group) {
                    ex.muscle_group.forEach(mg => {
                        muscleGroupCounts[mg] = (muscleGroupCounts[mg] || 0) + 1;
                    });
                }
                if (ex.sets) {
                    ex.sets.forEach(set => {
                        totalSets++;
                        totalReps += set.reps;
                    });
                }
            };

            if (item.superset) {
                item.superset.forEach(processExercise);
            } else {
                processExercise(item);
            }
        });
    });

    return {
        month,
        totalWorkouts: monthlyWorkouts.length,
        uniqueExercises: [...exerciseNames].sort(),
        muscleGroupCounts,
        totalSets,
        totalReps
    };
}

function getUniqueMuscleGroups(workouts) {
    const muscleGroups = new Set();
    workouts.forEach(workout => {
        workout.exercises.forEach(item => {
            const processExercise = (ex) => {
                if (ex.muscle_group) {
                    ex.muscle_group.forEach(mg => muscleGroups.add(mg));
                }
            };

            if (item.superset) {
                item.superset.forEach(processExercise);
            } else {
                processExercise(item);
            }
        });
    });
    return [...muscleGroups].sort();
}

function getMuscleGroupFrequency(muscleGroup, workouts) {
    const frequency = {};
    workouts.forEach(workout => {
        const date = new Date(workout.date);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        const key = `${year}-${month}`;

        let workedOut = false;
        workout.exercises.forEach(item => {
            const processExercise = (ex) => {
                if (ex.muscle_group && ex.muscle_group.includes(muscleGroup)) {
                    workedOut = true;
                }
            };

            if (item.superset) {
                item.superset.forEach(processExercise);
            } else {
                processExercise(item);
            }
        });

        if (workedOut) {
            frequency[key] = (frequency[key] || 0) + 1;
        }
    });
    return frequency;
}

// --- RENDER FUNCTIONS ---
function renderWorkoutDates(groupedWorkouts) {
    workoutsContainer.innerHTML = '';

    const sortedMonths = Object.keys(groupedWorkouts).sort((a, b) => {
        const [yearA, monthA] = a.split('-');
        const [yearB, monthB] = b.split('-');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateB - dateA;
    });

    sortedMonths.forEach(month => {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'mb-6';

        const monthHeader = document.createElement('h2');
        monthHeader.className = 'text-xl font-bold text-slate-300 mb-3';
        monthHeader.textContent = month.replace('-', ' ');
        monthContainer.appendChild(monthHeader);

        const workoutsGrid = document.createElement('div');
        workoutsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

        const workouts = groupedWorkouts[month];
        workouts.forEach(workout => {
            const dateButton = document.createElement('button');
            dateButton.className = 'bg-slate-800 p-4 rounded-lg text-left hover:bg-slate-700 transition-colors';
            dateButton.innerHTML = `<p class="font-bold text-sky-400">${workout.date}</p>`;
            dateButton.addEventListener('click', () => {
                renderLogDetails(workout);
                showView('log-detail');
            });
            workoutsGrid.appendChild(dateButton);
        });

        monthContainer.appendChild(workoutsGrid);
        workoutsContainer.appendChild(monthContainer);
    });
}

function renderLogDetails(workout) {
    logTitle.textContent = `Workout - ${workout.date}`;
    logExerciseContainer.innerHTML = '';

    workout.exercises.forEach(exerciseItem => {
        if (exerciseItem.superset) {
            const supersetContainer = document.createElement('div');
            supersetContainer.className = 'bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 mb-4';

            // Header
            const header = document.createElement('div');
            header.className = 'p-4 bg-slate-800 cursor-pointer flex justify-between items-center hover:bg-slate-700 transition-colors';
            header.style.userSelect = 'none';
            const groupName = exerciseItem.group_name || 'Superset';

            header.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-amber-400 font-bold text-lg">${groupName}</span>
                    <span class="text-xs text-slate-400">(${exerciseItem.superset.length} exercises)</span>
                </div>
                <span class="text-slate-400 transform transition-transform duration-200">▼</span>
            `;

            // Content Body
            const body = document.createElement('div');
            body.className = 'p-4 space-y-4';

            exerciseItem.superset.forEach(exercise => {
                const exEl = createExerciseElement(exercise);
                // Add a left border to indicate it's part of the group
                exEl.className += ' pl-4 border-l-2 border-slate-600';
                body.appendChild(exEl);
            });

            // Toggle Logic
            let isExpanded = true;
            const indicator = header.querySelector('span:last-child');

            const toggle = () => {
                isExpanded = !isExpanded;
                body.style.display = isExpanded ? 'block' : 'none';
                indicator.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
            };

            header.addEventListener('click', toggle);

            supersetContainer.appendChild(header);
            supersetContainer.appendChild(body);
            logExerciseContainer.appendChild(supersetContainer);
        } else {
            logExerciseContainer.appendChild(createExerciseElement(exerciseItem));
        }
    });
}

function createExerciseElement(exercise) {
    const exerciseEl = document.createElement('div');
    exerciseEl.className = 'mb-4';

    let setsHtml = '';
    if (exercise.sets) {
        setsHtml = exercise.sets.map(set => {
            const metrics = (exercise.tracked_metrics || 'reps,weight').split(',');
            let detailsParts = [];

            // Helper to format duration
            const formatDuration = (seconds) => {
                if (!seconds) return '';
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                return `${m}m ${s}s`;
            };

            if (metrics.includes('reps') && set.reps) {
                detailsParts.push(`${set.reps} reps`);
            }

            if (metrics.includes('weight') && set.weight_kg) {
                // Convert kg to lbs for display as per legacy code preference or stick to what API sends?
                // The API sends 'weight_kg' but populated with 'weight' from DB which is lbs according to import script.
                // Let's assume the value is the display value.
                detailsParts.push(`at ${set.weight_kg} lbs`);
            } else if (metrics.includes('weight') && set.weight) {
                detailsParts.push(`at ${set.weight} lbs`);
            }

            if (metrics.includes('time') && set.duration_seconds) {
                detailsParts.push(`Time: ${formatDuration(set.duration_seconds)}`);
            }

            if (metrics.includes('distance') && set.distance_m) {
                detailsParts.push(`Dist: ${set.distance_m}m`);
            }

            if (metrics.includes('height') && set.height_cm) {
                detailsParts.push(`Height: ${set.height_cm}cm`);
            }

            // Fallbacks for legacy/undefined metrics
            if (detailsParts.length === 0) {
                if (set.reps) detailsParts.push(`${set.reps} reps`);
                if (set.weight || set.weight_kg) detailsParts.push(`at ${set.weight || set.weight_kg} lbs`);
            }

            let details = detailsParts.join(', ');

            if (set.tempo) details += ` (Tempo: ${set.tempo})`;

            // Add notes in parenthesis if short, or separately?
            // Existing logic didn't show set notes inline well, let's append.
            if (set.notes) details += ` - ${set.notes}`;

            return `<li>${details}</li>`;
        }).join('');
    }

    let durationHtml = '';
    // Exercise level duration/distance (often unused in favor of sets, but keeping for compatibility)
    if (exercise.duration) {
        durationHtml += `<p>Duration: ${exercise.duration} minutes</p>`;
    }
    if (exercise.distance && exercise.type === 'cardio') {
        durationHtml += `<p>Distance: ${exercise.distance}</p>`;
    }

    exerciseEl.innerHTML = `
        <h4 class="font-bold text-lg">${exercise.name} <span class="text-sm text-slate-400">(${exercise.category || ''})</span></h4>
        <p class="text-sm text-slate-300">${(exercise.muscle_group || []).join(', ')}</p>
        ${durationHtml}
        <ul class="list-disc list-inside text-slate-400">${setsHtml}</ul>
        ${exercise.notes ? `<p class="text-xs text-slate-500 mt-1">Notes: ${exercise.notes}</p>` : ''}
    `;
    return exerciseEl;
}

function renderExerciseList(exercises) {
    exerciseListContainer.innerHTML = '';
    exercises.forEach(name => {
        const exerciseButton = document.createElement('button');
        exerciseButton.className = 'bg-slate-800 p-4 rounded-lg text-left hover:bg-slate-700 transition-colors';
        exerciseButton.innerHTML = `<p class="font-bold text-sky-400">${name}</p>`;
        exerciseButton.addEventListener('click', () => {
            renderExerciseProgress(name);
            showView('exercise-detail');
        });
        exerciseListContainer.appendChild(exerciseButton);
    });
}

function renderExerciseProgress(exerciseName) {
    exerciseTitle.textContent = exerciseName;

    const exerciseData = [];
    allWorkouts.forEach(workout => {
        workout.exercises.forEach(item => {
            const checkExercise = (ex) => {
                if (ex.name === exerciseName && ex.type === 'strength' && ex.sets) {
                    ex.sets.forEach(set => {
                        exerciseData.push({ date: workout.date, weight: set.weight, reps: set.reps });
                    });
                }
            };

            if (item.superset) {
                item.superset.forEach(checkExercise);
            } else {
                checkExercise(item);
            }
        });
    });

    // Sort data by date
    exerciseData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = exerciseData.map(d => d.date);
    const weightData = exerciseData.map(d => d.weight);

    if (progressChart) {
        progressChart.destroy();
    }

    progressChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight (lbs)',
                data: weightData,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' },
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0' }
                }
            }
        }
    });

    renderExerciseHistory(exerciseName);
}

function renderExerciseHistory(exerciseName) {
    const historyContainer = document.getElementById('exercise-history-container');
    historyContainer.innerHTML = '';

    const historyData = [];
    allWorkouts.forEach(workout => {
        workout.exercises.forEach(item => {
            const checkExercise = (ex) => {
                if (ex.name === exerciseName) {
                    historyData.push({
                        date: workout.date,
                        sets: ex.sets || [],
                        notes: ex.notes
                    });
                }
            };

            if (item.superset) {
                item.superset.forEach(checkExercise);
            } else {
                checkExercise(item);
            }
        });
    });

    // Sort by date descending
    historyData.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (historyData.length === 0) {
        historyContainer.innerHTML = '<p class="text-slate-400 italic">No history found for this exercise.</p>';
        return;
    }

    historyData.forEach(entry => {
        const entryEl = document.createElement('div');
        entryEl.className = 'bg-slate-800 p-4 rounded-lg border border-slate-700';

        const dateEl = document.createElement('div');
        dateEl.className = 'flex justify-between items-center mb-2';
        dateEl.innerHTML = `<span class="font-bold text-sky-400">${entry.date}</span>`;
        entryEl.appendChild(dateEl);

        const setsList = document.createElement('ul');
        setsList.className = 'space-y-1 text-sm text-slate-300';

        if (entry.sets.length > 0) {
            entry.sets.forEach((set, index) => {
                let text = `Set ${set.set_number || index + 1}: `;
                const parts = [];

                if (set.reps) parts.push(`${set.reps} reps`);
                if (set.weight_kg) parts.push(`${set.weight_kg} lbs`); // Legacy: weight_kg field holding lbs
                else if (set.weight) parts.push(`${set.weight} lbs`);
                if (set.duration_seconds) {
                    const m = Math.floor(set.duration_seconds / 60);
                    const s = set.duration_seconds % 60;
                    parts.push(`${m}m ${s}s`);
                }
                if (set.distance_m) parts.push(`${set.distance_m}m`);
                if (set.height_cm) parts.push(`${set.height_cm}cm`);

                text += parts.join(' @ ');

                if (set.completed) text += ' ✅';

                const li = document.createElement('li');
                li.textContent = text;
                setsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No sets recorded';
            li.className = 'italic text-slate-500';
            setsList.appendChild(li);
        }
        entryEl.appendChild(setsList);

        if (entry.notes) {
            const notesEl = document.createElement('p');
            notesEl.className = 'text-xs text-slate-500 mt-2 italic';
            notesEl.textContent = `Notes: ${entry.notes}`;
            entryEl.appendChild(notesEl);
        }

        historyContainer.appendChild(entryEl);
    });
}

function renderMonthlyReport(reportData) {
    monthlyReportTitle.textContent = `Report for ${reportData.month.replace('-', ' ')}`;
    monthlyReportContainer.innerHTML = '';

    const statsContainer = document.createElement('div');
    statsContainer.className = 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6';
    statsContainer.innerHTML = `
        <div class="bg-slate-800 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold">${reportData.totalWorkouts}</p>
            <p class="text-slate-400">Workouts</p>
        </div>
        <div class="bg-slate-800 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold">${reportData.totalSets}</p>
            <p class="text-slate-400">Sets</p>
        </div>
        <div class="bg-slate-800 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold">${reportData.totalReps}</p>
            <p class="text-slate-400">Reps</p>
        </div>
        <div class="bg-slate-800 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold">${reportData.uniqueExercises.length}</p>
            <p class="text-slate-400">Unique Exercises</p>
        </div>
    `;
    monthlyReportContainer.appendChild(statsContainer);

    const contentContainer = document.createElement('div');
    contentContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

    // Muscle Group Chart
    const chartContainer = document.createElement('div');
    chartContainer.className = 'bg-slate-800 p-4 rounded-lg';
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);

    const sortedMuscleGroups = Object.entries(reportData.muscleGroupCounts).sort((a, b) => b[1] - a[1]);
    const muscleGroupLabels = sortedMuscleGroups.map(entry => entry[0]);
    const muscleGroupData = sortedMuscleGroups.map(entry => entry[1]);

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: muscleGroupLabels,
            datasets: [{
                data: muscleGroupData,
                backgroundColor: ['#38bdf8', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#fb923c', '#a8a29e'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#e2e8f0' }
                }
            }
        }
    });

    // Exercises List
    const exercisesContainer = document.createElement('div');
    exercisesContainer.className = 'bg-slate-800 p-4 rounded-lg';
    exercisesContainer.innerHTML = '<h3 class="text-lg font-bold text-sky-400 mb-2">Exercises Performed</h3>';
    const exerciseList = document.createElement('ul');
    exerciseList.className = 'list-disc list-inside text-slate-400';
    reportData.uniqueExercises.forEach(exercise => {
        const li = document.createElement('li');
        li.textContent = exercise;
        exerciseList.appendChild(li);
    });
    exercisesContainer.appendChild(exerciseList);

    contentContainer.appendChild(chartContainer);
    contentContainer.appendChild(exercisesContainer);
    monthlyReportContainer.appendChild(contentContainer);
}

function populateMonthSelect(workouts) {
    monthSelect.innerHTML = '';
    const months = [...new Set(workouts.map(w => {
        const date = new Date(w.date);
        return `${date.getFullYear()}-${date.toLocaleString('default', { month: 'long' })}`;
    }))].sort((a, b) => {
        const [yearA, monthA] = a.split('-');
        const [yearB, monthB] = b.split('-');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateB - dateA;
    });

    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month.replace('-', ' ');
        monthSelect.appendChild(option);
    });
}

function populateMuscleGroupSelect(workouts) {
    muscleGroupSelect.innerHTML = '';
    const muscleGroups = getUniqueMuscleGroups(workouts);
    muscleGroups.forEach(mg => {
        const option = document.createElement('option');
        option.value = mg;
        option.textContent = mg;
        muscleGroupSelect.appendChild(option);
    });
}

let muscleGroupChartInstance = null;
function renderMuscleGroupChart(data, muscleGroup) {
    const labels = Object.keys(data).sort((a, b) => {
        const [yearA, monthA] = a.split('-');
        const [yearB, monthB] = b.split('-');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA - dateB;
    });
    const values = labels.map(label => data[label]);

    if (muscleGroupChartInstance) {
        muscleGroupChartInstance.destroy();
    }

    muscleGroupChartInstance = new Chart(muscleGroupChart, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `'${muscleGroup}' Workouts`,
                data: values,
                backgroundColor: '#38bdf8',
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    ticks: { color: '#94a3b8', stepSize: 1 },
                    grid: { color: '#334155' },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderLogWorkoutForm() {
    document.getElementById('workout-date').valueAsDate = new Date();
    document.getElementById('exercises-log-container').innerHTML = '';
    addExerciseToForm();
}

function addExerciseToForm() {
    const exerciseId = `exercise-${Date.now()}`;
    const exerciseHtml = `
        <div id="${exerciseId}" class="bg-slate-800 p-4 rounded-lg space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Exercise Name:</label>
                    <input type="text" class="exercise-name bg-slate-700 border border-slate-600 text-white text-sm rounded-lg block w-full p-2.5" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-1">Category:</label>
                    <input type="text" class="exercise-category bg-slate-700 border border-slate-600 text-white text-sm rounded-lg block w-full p-2.5">
                </div>
            </div>
            <div class="sets-container space-y-2">
                <!-- Sets will be added here -->
            </div>
            <button type="button" class="add-set-button bg-slate-600 hover:bg-slate-500 text-white font-bold py-1 px-3 rounded-lg text-sm">Add Set</button>
            <button type="button" class="remove-exercise-button bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg text-sm">Remove Exercise</button>
        </div>
    `;
    const container = document.getElementById('exercises-log-container');
    container.insertAdjacentHTML('beforeend', exerciseHtml);

    const newExercise = document.getElementById(exerciseId);
    newExercise.querySelector('.add-set-button').addEventListener('click', () => addSetToExercise(exerciseId));
    newExercise.querySelector('.remove-exercise-button').addEventListener('click', () => newExercise.remove());

    addSetToExercise(exerciseId); // Add one set by default
}

function addSetToExercise(exerciseId) {
    const setId = `set-${Date.now()}`;
    const setHtml = `
        <div id="${setId}" class="grid grid-cols-3 md:grid-cols-4 gap-2 items-center">
            <div>
                <label class="block text-xs font-medium text-slate-400">Reps:</label>
                <input type="number" class="set-reps bg-slate-700 border border-slate-600 text-white text-sm rounded-lg block w-full p-2" required>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-400">Weight:</label>
                <input type="number" class="set-weight bg-slate-700 border border-slate-600 text-white text-sm rounded-lg block w-full p-2" required>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-400">Notes:</label>
                <input type="text" class="set-notes bg-slate-700 border border-slate-600 text-white text-sm rounded-lg block w-full p-2">
            </div>
            <button type="button" class="remove-set-button bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded-lg text-xs self-end">Remove</button>
        </div>
    `;
    const setsContainer = document.querySelector(`#${exerciseId} .sets-container`);
    setsContainer.insertAdjacentHTML('beforeend', setHtml);
    document.querySelector(`#${setId} .remove-set-button`).addEventListener('click', () => document.getElementById(setId).remove());
}

async function saveWorkout(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : 'Save Workout';
    if (submitButton) {
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;
    }

    try {
        const workoutDate = document.getElementById('workout-date').value;

        // 1. Create Workout
        const workoutResponse = await fetch(`${API_BASE_URL}/workouts/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: 1, // Hardcoded for now
                date: workoutDate,
                start_time: null,
                end_time: null,
                notes: 'Logged via web UI'
            })
        });

        if (!workoutResponse.ok) throw new Error('Failed to create workout');
        const workout = await workoutResponse.json();
        const workoutId = workout.id;

        // 2. Fetch existing exercises to avoid duplicates
        const exercisesResponse = await fetch(`${API_BASE_URL}/exercises/`);
        if (!exercisesResponse.ok) throw new Error('Failed to fetch exercises');
        const existingExercises = await exercisesResponse.json();
        const exerciseMap = new Map(existingExercises.map(e => [e.name.toLowerCase(), e.id]));

        // 3. Process Exercises and Sets
        const exerciseElements = document.querySelectorAll('#exercises-log-container > div');

        for (let i = 0; i < exerciseElements.length; i++) {
            const exerciseEl = exerciseElements[i];
            const name = exerciseEl.querySelector('.exercise-name').value;
            const category = exerciseEl.querySelector('.exercise-category').value;

            let exerciseId = exerciseMap.get(name.toLowerCase());

            // Create exercise if it doesn't exist
            if (!exerciseId) {
                const newExerciseResponse = await fetch(`${API_BASE_URL}/exercises/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        type: category,
                        tracked_metrics: 'reps,weight'
                    })
                });
                if (!newExerciseResponse.ok) throw new Error(`Failed to create exercise: ${name}`);
                const newExercise = await newExerciseResponse.json();
                exerciseId = newExercise.id;
            }

            // Link Exercise to Workout
            const workoutExerciseResponse = await fetch(`${API_BASE_URL}/workout_exercises/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workout_id: workoutId,
                    exercise_id: exerciseId,
                    sequence: i + 1
                })
            });
            if (!workoutExerciseResponse.ok) throw new Error('Failed to link exercise to workout');
            const workoutExercise = await workoutExerciseResponse.json();
            const workoutExerciseId = workoutExercise.id;

            // Process Sets
            const setElements = exerciseEl.querySelectorAll('.sets-container > div');
            for (let j = 0; j < setElements.length; j++) {
                const setEl = setElements[j];
                const reps = parseInt(setEl.querySelector('.set-reps').value) || 0;
                const weight = parseFloat(setEl.querySelector('.set-weight').value) || 0;
                const notes = setEl.querySelector('.set-notes').value;

                await fetch(`${API_BASE_URL}/workout_sets/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        workout_exercise_id: workoutExerciseId,
                        set_number: j + 1,
                        reps: reps,
                        weight_kg: weight,
                        notes: notes
                    })
                });
            }
        }

        alert('Workout saved successfully!');
        showView('workouts-list');
        // Optional: Reload data if we were fetching from API
        // initialize(); 

    } catch (error) {
        console.error('Error saving workout:', error);
        alert(`Error saving workout: ${error.message}`);
    } finally {
        if (submitButton) {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    }
}


// --- VIEW MANAGEMENT ---
function showView(viewName) {
    // Hide all views
    loadingView.classList.add('hidden');
    workoutsListView.classList.add('hidden');
    logDetailView.classList.add('hidden');
    exerciseProgressView.classList.add('hidden');
    exerciseDetailView.classList.add('hidden');
    monthlyReportView.classList.add('hidden');
    muscleGroupProgressView.classList.add('hidden');
    // logWorkoutView.classList.add('hidden'); // Removed

    // Show the requested view
    if (viewName === 'loading') {
        loadingView.classList.remove('hidden');
        headerTitle.textContent = 'Loading...';
    } else if (viewName === 'workouts-list') {
        workoutsListView.classList.remove('hidden');
        headerTitle.textContent = 'Logged Workouts';
    } else if (viewName === 'routines-list') {
        routinesListView.classList.remove('hidden');
        headerTitle.textContent = 'Routines';
    } else if (viewName === 'routine-detail') {
        routineDetailView.classList.remove('hidden');
        // Title set in openRoutineDetail
    } else if (viewName === 'routine-day') {
        routineDayView.classList.remove('hidden');
        // Title set in openRoutineDay
    } else if (viewName === 'active-workout') {
        activeWorkoutView.classList.remove('hidden');
        headerTitle.textContent = 'Active Workout';
    } else if (viewName === 'log-detail') {
        logDetailView.classList.remove('hidden');
        // Title is set in renderLogDetails
    } else if (viewName === 'exercise-progress') {
        exerciseProgressView.classList.remove('hidden');
        headerTitle.textContent = 'Exercise Progress';
    } else if (viewName === 'exercise-detail') {
        exerciseDetailView.classList.remove('hidden');
        // Title is set in renderExerciseProgress
    } else if (viewName === 'monthly-report') {
        monthlyReportView.classList.remove('hidden');
        headerTitle.textContent = 'Monthly Report';
    } else if (viewName === 'muscle-group-progress') {
        muscleGroupProgressView.classList.remove('hidden');
        headerTitle.textContent = 'Muscle Group Progress';
    } else if (viewName === 'active-workout') {
        activeWorkoutView.classList.remove('hidden');
        headerTitle.textContent = 'Active Workout';
    }
}

function onFailure(error) {
    console.error('An error occurred:', error);
    workoutsContainer.innerHTML = `<p class="text-red-500 text-center">Error loading data. Please check the console.</p>`;
    showView('workouts-list');
}

// --- ACTIVE WORKOUT LOGIC ---
let currentWorkoutId = null;
let workoutStartTime = null;
let timerInterval = null;

function startActiveWorkout() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Create workout in backend
    fetch(`${API_BASE_URL}/workouts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: 1, // Hardcoded for now
            date: dateStr,
            start_time: timeStr
        })
    })
        .then(response => response.json())
        .then(workout => {
            currentWorkoutId = workout.id;
            workoutStartTime = now;
            startTimer();
            activeExercisesContainer.innerHTML = '';
            showView('active-workout');
        })
        .catch(error => console.error('Error starting workout:', error));
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const now = new Date();
        const diff = now - workoutStartTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        activeTimer.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, 1000);
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function finishActiveWorkout() {
    if (!currentWorkoutId) return;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    fetch(`${API_BASE_URL}/workouts/${currentWorkoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: 1,
            date: workoutStartTime.toISOString().split('T')[0],
            start_time: workoutStartTime.toTimeString().split(' ')[0],
            end_time: timeStr,
            notes: "Finished via Active Logger"
        })
    })
        .then(() => {
            clearInterval(timerInterval);
            currentWorkoutId = null;
            alert('Workout Finished!');
            showView('workouts-list');
            location.reload();
        })
        .catch(error => console.error('Error finishing workout:', error));
}

function openExerciseModal() {
    exerciseSelectionModal.classList.remove('hidden');
    renderModalExerciseList();
}

function renderModalExerciseList(filter = '') {
    modalExerciseList.innerHTML = '';
    const exercises = Object.values(window.exercisesMap || {});
    const filtered = exercises
        .filter(ex => ex.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    filtered.forEach(ex => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors';
        btn.textContent = ex.name;
        btn.addEventListener('click', () => {
            addExerciseToActiveWorkout(ex);
            exerciseSelectionModal.classList.add('hidden');
        });
        modalExerciseList.appendChild(btn);
    });
}

function filterExerciseList(query) {
    renderModalExerciseList(query);
}





function addSetToActiveExercise(workoutExerciseId, container) {
    const setNumber = container.children.length + 1;

    // Create set in backend (initially empty/default)
    fetch(`${API_BASE_URL}/workout_sets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            workout_exercise_id: workoutExerciseId,
            set_number: setNumber,
            reps: 0,
            weight_kg: 0
        })
    })
        .then(response => response.json())
        .then(workoutSet => {
            const setEl = document.createElement('div');
            setEl.className = 'flex items-center gap-2';
            setEl.innerHTML = `
            <span class="text-slate-500 w-6 text-center">${setNumber}</span>
            <input type="number" placeholder="lbs" class="weight-input bg-slate-900 border border-slate-700 text-white text-sm rounded-lg block w-20 p-2" value="">
            <input type="number" placeholder="reps" class="reps-input bg-slate-900 border border-slate-700 text-white text-sm rounded-lg block w-20 p-2" value="">
            <button class="save-set-btn text-green-500 hover:text-green-400 ml-auto">✓</button>
        `;

            const saveBtn = setEl.querySelector('.save-set-btn');
            const weightInput = setEl.querySelector('.weight-input');
            const repsInput = setEl.querySelector('.reps-input');

            // Auto-populate from last history
            // Need exerciseId. It's not passed directly, but we can find it from DOM or pass it.
            // Passed 'container' is inside exerciseEl which has dataset.exerciseId
            const exerciseEl = container.closest('[data-exercise-id]');
            const exerciseId = exerciseEl ? exerciseEl.dataset.exerciseId : null;

            // Add helper text element
            const helperText = document.createElement('span');
            helperText.className = 'text-xs text-slate-500 ml-2 hidden';
            setEl.appendChild(helperText);

            if (exerciseId) {
                let url = `${API_BASE_URL}/exercises/${exerciseId}/last_set?set_number=${setNumber}`;
                if (window.currentWorkoutId) {
                    url += `&current_workout_id=${window.currentWorkoutId}`;
                }

                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        if (data) {
                            if (data.weight_kg) weightInput.value = data.weight_kg;
                            if (data.reps) repsInput.value = data.reps;

                            // Show helper text
                            helperText.textContent = `Last: ${data.weight_kg}lbs x ${data.reps}`;
                            helperText.classList.remove('hidden');
                        }
                    })
                    .catch(err => console.error("Error fetching history:", err));
            }

            saveBtn.addEventListener('click', () => {
                updateSet(workoutSet.id, workoutExerciseId, setNumber, weightInput.value, repsInput.value, saveBtn);
            });

            container.appendChild(setEl);
        })
        .catch(error => console.error('Error adding set:', error));
}

function updateSet(setId, workoutExerciseId, setNumber, weight, reps, btn) {
    fetch(`${API_BASE_URL}/workout_sets/${setId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            workout_exercise_id: workoutExerciseId,
            set_number: setNumber,
            weight_kg: parseFloat(weight),
            reps: parseInt(reps)
        })
    })
        .then(response => response.json())
        .then(() => {
            btn.textContent = 'Saved';
            setTimeout(() => btn.textContent = '✓', 2000);
        })
        .catch(error => console.error('Error updating set:', error));
}

// --- ROUTINE MANAGEMENT ---

function fetchRoutines() {
    fetch(`${API_BASE_URL}/routines/`)
        .then(res => res.json())
        .then(routines => {
            renderRoutinesList(routines);
        })
        .catch(err => console.error('Error fetching routines:', err));
}

function renderRoutinesList(routines) {
    routinesContainer.innerHTML = '';
    routines.forEach(routine => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-4 rounded-lg flex justify-between items-center hover:bg-slate-700 transition-colors cursor-pointer';
        div.innerHTML = `
            <div>
                <h3 class="font-bold text-lg text-sky-400">${routine.name}</h3>
                <p class="text-sm text-slate-400">${routine.description || 'No description'}</p>
            </div>
            <span class="text-slate-500">&rarr;</span>
        `;
        div.addEventListener('click', () => openRoutineDetail(routine));
        routinesContainer.appendChild(div);
    });
}

function createRoutine() {
    const name = prompt("Enter routine name:");
    if (!name) return;

    fetch(`${API_BASE_URL}/routines/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: 1, // Hardcoded
            name: name,
            description: ''
        })
    })
        .then(res => res.json())
        .then(routine => {
            fetchRoutines();
        })
        .catch(err => console.error('Error creating routine:', err));
}

function openRoutineDetail(routine) {
    currentRoutine = routine;
    routineDetailTitle.textContent = routine.name;
    fetch(`${API_BASE_URL}/routines/${routine.id}/days`)
        .then(res => res.json())
        .then(days => {
            renderRoutineDays(days);
            showView('routine-detail');
        });
}

function renderRoutineDays(days) {
    routineDaysContainer.innerHTML = '';
    const daysMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach(day => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800 p-4 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer';
        div.innerHTML = `
            <h4 class="font-bold text-lg text-white">${day.name}</h4>
            <p class="text-sm text-sky-400">${daysMap[day.day_of_week]}</p>
        `;
        div.addEventListener('click', () => openRoutineDay(day));
        routineDaysContainer.appendChild(div);
    });
}

function addDayToRoutine(dayOfWeek) {
    if (!currentRoutine) return;
    const daysMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const name = prompt(`Enter name for ${daysMap[dayOfWeek]} (e.g. "Push Day"):`, `${daysMap[dayOfWeek]} Workout`);
    if (!name) return;

    fetch(`${API_BASE_URL}/routine_days/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            routine_id: currentRoutine.id,
            name: name,
            day_of_week: dayOfWeek
        })
    })
        .then(res => res.json())
        .then(day => {
            openRoutineDetail(currentRoutine);
        });
}

function openRoutineDay(day) {
    currentRoutineDay = day;
    routineDayTitle.textContent = day.name;
    fetch(`${API_BASE_URL}/routine_days/${day.id}/exercises`)
        .then(res => res.json())
        .then(exercises => {
            renderRoutineDayExercises(exercises);
            showView('routine-day');
        });
}

function renderRoutineDayExercises(exercises) {
    routineDayExercisesContainer.innerHTML = '';

    // Group exercises
    const grouped = {};
    const order = [];

    exercises.forEach(ex => {
        const groupName = ex.group_name || 'Main Workout';
        if (!grouped[groupName]) {
            grouped[groupName] = [];
            order.push(groupName);
        }
        grouped[groupName].push(ex);
    });

    order.forEach(groupName => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mb-6';

        const groupHeader = document.createElement('h4');
        groupHeader.className = 'text-sm font-bold text-slate-500 uppercase tracking-wider mb-3';
        groupHeader.textContent = groupName;
        groupDiv.appendChild(groupHeader);

        const listDiv = document.createElement('div');
        listDiv.className = 'space-y-3';

        grouped[groupName].forEach(ex => {
            // We need to fetch exercise details to get the name
            const exerciseDetails = window.exercisesMap[ex.exercise_id];
            const name = exerciseDetails ? exerciseDetails.name : 'Unknown Exercise';

            const div = document.createElement('div');
            div.className = 'bg-slate-800 p-4 rounded-lg flex justify-between items-center';
            div.innerHTML = `
                <p class="font-bold text-white">${name}</p>
                <p class="text-sm text-slate-400">${ex.suggested_sets || 3} sets x ${ex.suggested_reps || '8-12'} reps</p>
            `;
            listDiv.appendChild(div);
        });

        groupDiv.appendChild(listDiv);
        routineDayExercisesContainer.appendChild(groupDiv);
    });
}

function addExerciseToRoutineDay(exerciseId) {
    if (!currentRoutineDay) return;

    // Get current count to set sequence
    const currentCount = routineDayExercisesContainer.children.length;

    fetch(`${API_BASE_URL}/routine_exercises/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            routine_day_id: currentRoutineDay.id,
            exercise_id: exerciseId,
            sequence: currentCount + 1,
            suggested_sets: 3,
            suggested_reps: '8-12'
        })
    })
        .then(res => res.json())
        .then(ex => {
            openRoutineDay(currentRoutineDay);
        });
}

function renderSuggestedWorkout(data) {
    suggestedWorkoutContainer.classList.remove('hidden');
    suggestedWorkoutTitle.textContent = `${data.routine_name} - ${data.day_name}`;
    suggestedExercisesList.innerHTML = '';

    // Group exercises
    const grouped = {};
    const order = []; // Keep track of group order

    data.exercises.forEach(ex => {
        const groupName = ex.group_name || 'Main Workout';
        if (!grouped[groupName]) {
            grouped[groupName] = [];
            order.push(groupName);
        }
        grouped[groupName].push(ex);
    });

    order.forEach(groupName => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mb-4';

        const groupHeader = document.createElement('h4');
        groupHeader.className = 'text-sm font-bold text-slate-500 uppercase tracking-wider mb-2';
        groupHeader.textContent = groupName;
        groupDiv.appendChild(groupHeader);

        grouped[groupName].forEach(ex => {
            const div = document.createElement('div');
            div.className = 'flex items-center mb-1';
            div.innerHTML = `<span class="w-2 h-2 bg-sky-500 rounded-full mr-2"></span>${ex.name}`;
            groupDiv.appendChild(div);
        });

        suggestedExercisesList.appendChild(groupDiv);
    });
}

// --- ACTIVE WORKOUT OVERRIDE ---

function startActiveWorkout(initialExercises = []) {
    showView('active-workout');
    activeExercisesContainer.innerHTML = '';
    currentActiveExerciseIndex = 0;

    // Start Timer
    let seconds = 0;
    const timerInterval = setInterval(() => {
        seconds++;
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        activeTimer.textContent = `${h}:${m}:${s}`;
    }, 1000);

    // Store interval ID to clear it later
    window.activeWorkoutTimer = timerInterval;

    // Create Workout Instance immediately
    const workoutDate = new Date().toISOString().split('T')[0];
    fetch(`${API_BASE_URL}/workouts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: 1,
            date: workoutDate,
            start_time: new Date().toTimeString().split(' ')[0],
            notes: 'Active Workout'
        })
    })
        .then(res => res.json())
        .then(workout => {
            window.currentWorkoutId = workout.id;

            if (initialExercises.length > 0) {
                // Add all exercises first
                initialExercises.forEach(ex => {
                    addExerciseToActiveWorkout(ex, false); // false = don't update view yet
                });
                // Then update view once
                setTimeout(updateActiveExerciseView, 100);
            } else {
                updateActiveExerciseView();
            }
        })
        .catch(err => console.error('Error creating active workout:', err));
}

function updateActiveExerciseView() {
    const cards = activeExercisesContainer.children;
    const total = cards.length;

    if (total === 0) {
        activeWorkoutProgress.textContent = "No Exercises";
        prevExerciseBtn.disabled = true;
        nextExerciseBtn.disabled = true;
        return;
    }

    // Clamp index
    if (currentActiveExerciseIndex < 0) currentActiveExerciseIndex = 0;
    if (currentActiveExerciseIndex >= total) currentActiveExerciseIndex = total - 1;

    // Toggle visibility
    Array.from(cards).forEach((card, index) => {
        if (index === currentActiveExerciseIndex) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });

    // Update progress text
    activeWorkoutProgress.textContent = `Exercise ${currentActiveExerciseIndex + 1} / ${total}`;

    // Update buttons
    prevExerciseBtn.disabled = currentActiveExerciseIndex === 0;
    nextExerciseBtn.disabled = currentActiveExerciseIndex === total - 1;

    // If last exercise, maybe change Next to Finish? 
    // For now, keep it simple.
}

function navigateActiveExercise(direction) {
    currentActiveExerciseIndex += direction;
    updateActiveExerciseView();
}

function addExerciseToActiveWorkout(exercise, updateView = true) {
    // Create workout_exercise entry
    fetch(`${API_BASE_URL}/workout_exercises/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            workout_id: window.currentWorkoutId,
            exercise_id: exercise.id,
            sequence: activeExercisesContainer.children.length + 1
        })
    })
        .then(response => response.json())
        .then(workoutExercise => {
            renderActiveExercise(workoutExercise, exercise);
            if (updateView) {
                // If adding manually, jump to it
                currentActiveExerciseIndex = activeExercisesContainer.children.length - 1;
                updateActiveExerciseView();
            }
        })
        .catch(error => console.error('Error adding exercise:', error));
}

function renderActiveExercise(workoutExercise, exercise) {
    const exerciseEl = document.createElement('div');
    exerciseEl.className = 'bg-slate-800 p-4 rounded-lg hidden'; // Hidden by default
    exerciseEl.dataset.id = workoutExercise.id;
    exerciseEl.dataset.exerciseId = exercise.id;

    exerciseEl.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="font-bold text-xl text-sky-400">${exercise.name}</h3>
                <p class="text-sm text-slate-400">${exercise.group_name || 'Main Lift'}</p>
            </div>
            <button class="text-red-400 hover:text-red-300 text-sm" onclick="removeActiveExercise(this)">Remove</button>
        </div>
        
        <div class="sets-container space-y-3 mb-4"></div>
        
        <button class="add-set-btn w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-3 px-4 rounded-lg transition-colors border border-dashed border-slate-600">
            + Add Set
        </button>
    `;

    const addSetBtn = exerciseEl.querySelector('.add-set-btn');
    addSetBtn.addEventListener('click', () => addSetToActiveExercise(workoutExercise.id, exerciseEl.querySelector('.sets-container')));

    activeExercisesContainer.appendChild(exerciseEl);
    // Add initial set
    addSetToActiveExercise(workoutExercise.id, exerciseEl.querySelector('.sets-container'));
}

function removeActiveExercise(btn) {
    const card = btn.closest('.bg-slate-800');
    card.remove();
    updateActiveExerciseView();
}
