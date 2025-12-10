document.addEventListener('DOMContentLoaded', initialize);

// --- STATE ---
let allWorkouts = [];
let uniqueExercises = [];
let progressChart = null;

// --- DOM ELEMENTS ---
const loadingView = document.getElementById('loading-view');
const workoutsListView = document.getElementById('workouts-list-view');
const logDetailView = document.getElementById('log-detail-view');
const exerciseProgressView = document.getElementById('exercise-progress-view');
const exerciseDetailView = document.getElementById('exercise-detail-view');

const homeButton = document.getElementById('home-button');
const progressButton = document.getElementById('progress-button');
const backToHomeButton = document.getElementById('back-to-home-button');
const backToProgressButton = document.getElementById('back-to-progress-button');

const headerTitle = document.getElementById('header-title');
const workoutsContainer = document.getElementById('workouts-container');
const logTitle = document.getElementById('log-title');
const logExerciseContainer = document.getElementById('log-exercise-container');
const exerciseListContainer = document.getElementById('exercise-list-container');
const exerciseTitle = document.getElementById('exercise-title');
const chartCanvas = document.getElementById('progress-chart');


function initialize() {
    showView('loading');
    headerTitle.textContent = "Logged Workouts";

    fetch('workouts-data/new-workout.workout.json')
        .then(response => response.json())
        .then(data => {
            allWorkouts = data;
            uniqueExercises = getUniqueExercises(allWorkouts);
            renderWorkoutDates(allWorkouts);
            renderExerciseList(uniqueExercises);
            showView('workouts-list');
        })
        .catch(error => {
            console.error('Error loading workout data:', error);
            onFailure(error);
        });

    // Navigation event listeners
    homeButton.addEventListener('click', () => showView('workouts-list'));
    progressButton.addEventListener('click', () => showView('exercise-progress'));
    backToHomeButton.addEventListener('click', () => showView('workouts-list'));
    backToProgressButton.addEventListener('click', () => showView('exercise-progress'));
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

// --- RENDER FUNCTIONS ---
function renderWorkoutDates(workouts) {
    workoutsContainer.innerHTML = '';
    workouts.forEach(workout => {
        const dateButton = document.createElement('button');
        dateButton.className = 'bg-slate-800 p-4 rounded-lg text-left hover:bg-slate-700 transition-colors';
        dateButton.innerHTML = `<p class="font-bold text-sky-400">${workout.date}</p>`;
        dateButton.addEventListener('click', () => {
            renderLogDetails(workout);
            showView('log-detail');
        });
        workoutsContainer.appendChild(dateButton);
    });
}

function renderLogDetails(workout) {
    logTitle.textContent = `Workout - ${workout.date}`;
    logExerciseContainer.innerHTML = '';

    workout.exercises.forEach(exerciseItem => {
        if (exerciseItem.superset) {
            const supersetContainer = document.createElement('div');
            supersetContainer.className = 'bg-slate-800 p-4 rounded-lg';
            supersetContainer.innerHTML = '<h3 class="font-bold mb-2 text-amber-400">Superset</h3>';
            exerciseItem.superset.forEach(exercise => {
                supersetContainer.appendChild(createExerciseElement(exercise));
            });
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
            let details = `${set.reps} reps at ${set.weight} lbs`;
            if (set.distance) details += `, ${set.distance}`;
            if (set.height) details += `, ${set.height}`;
            if (set.tempo) details += ` (Tempo: ${set.tempo.down}-${set.tempo.hold}-${set.tempo.up}-${set.tempo.pause})`;
            return `<li>${details}</li>`;
        }).join('');
    }

    let durationHtml = '';
    if (exercise.duration) {
        durationHtml = `<p>Duration: ${exercise.duration} minutes</p>`;
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
}


// --- VIEW MANAGEMENT ---
function showView(viewName) {
    // Hide all views
    loadingView.classList.add('hidden');
    workoutsListView.classList.add('hidden');
    logDetailView.classList.add('hidden');
    exerciseProgressView.classList.add('hidden');
    exerciseDetailView.classList.add('hidden');

    // Show the requested view
    if (viewName === 'loading') {
        loadingView.classList.remove('hidden');
        headerTitle.textContent = 'Loading...';
    } else if (viewName === 'workouts-list') {
        workoutsListView.classList.remove('hidden');
        headerTitle.textContent = 'Logged Workouts';
    } else if (viewName === 'log-detail') {
        logDetailView.classList.remove('hidden');
        // Title is set in renderLogDetails
    } else if (viewName === 'exercise-progress') {
        exerciseProgressView.classList.remove('hidden');
        headerTitle.textContent = 'Exercise Progress';
    } else if (viewName === 'exercise-detail') {
        exerciseDetailView.classList.remove('hidden');
        // Title is set in renderExerciseProgress
    }
}

function onFailure(error) {
    console.error('An error occurred:', error);
    workoutsContainer.innerHTML = `<p class="text-red-500 text-center">Error loading data. Please check the console.</p>`;
    showView('workouts-list');
}
