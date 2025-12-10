export function renderInGym(container, service) {
    const routines = service.getRoutines();

    // Check if there is an active workout state stored (mocking simple state)
    // For now, we start with a "Start Workout" selection screen.

    const wrapper = document.createElement('div');
    wrapper.className = 'p-4 space-y-6 pb-20';

    // Section 1: Quick Start
    const quickStartSection = document.createElement('div');
    quickStartSection.innerHTML = `
        <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Start</h2>
        <button class="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-sky-900/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]">
            <i class="ph ph-plus-circle text-xl"></i>
            <span>Empty Workout</span>
        </button>
    `;
    wrapper.appendChild(quickStartSection);

    // Section 2: Start from Routine
    const routinesSection = document.createElement('div');
    routinesSection.innerHTML = `
        <h2 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Start from Routine</h2>
    `;

    if (routines.length === 0) {
        routinesSection.innerHTML += `<p class="text-slate-500 text-center py-4 bg-slate-800/50 rounded-xl">No routines found. Create one in the Planner!</p>`;
    } else {
        const list = document.createElement('div');
        list.className = 'space-y-3';
        routines.forEach(routine => {
            const btn = document.createElement('button');
            btn.className = 'w-full bg-slate-800 hover:bg-slate-750 p-4 rounded-xl text-left border border-slate-700/50 flex justify-between items-center group transition-all active:scale-[0.99]';
            btn.innerHTML = `
                <div>
                    <h3 class="font-bold text-slate-200 text-lg group-hover:text-sky-400 transition-colors">${routine.name}</h3>
                    <p class="text-xs text-slate-500 mt-1">${routine.exercises.length} exercises</p>
                </div>
                <i class="ph ph-caret-right text-slate-500 group-hover:text-sky-400"></i>
            `;
            btn.addEventListener('click', () => startWorkout(container, service, routine));
            list.appendChild(btn);
        });
        routinesSection.appendChild(list);
    }
    wrapper.appendChild(routinesSection);

    container.appendChild(wrapper);
}

function startWorkout(container, service, routine) {
    // Render the active workout interface
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col h-full';

    // Header with timer (mock)
    const header = document.createElement('div');
    header.className = 'bg-slate-800 p-4 sticky top-0 z-10 border-b border-slate-700 shadow-md';
    header.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-xl font-bold text-white">${routine ? routine.name : 'Empty Workout'}</h2>
            <div class="text-sky-400 font-mono font-bold text-xl bg-slate-900 px-3 py-1 rounded-lg">00:00</div>
        </div>
        <div class="flex justify-between text-xs text-slate-400">
            <span>Started: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            <button class="text-red-400 font-bold hover:text-red-300">Cancel</button>
        </div>
    `;
    wrapper.appendChild(header);

    // Exercises List
    const exerciseList = document.createElement('div');
    exerciseList.className = 'flex-1 overflow-y-auto p-4 space-y-6 pb-32'; // Extra padding for fixed bottom bar

    const exercises = routine ? routine.exercises : [];

    exercises.forEach((ex, index) => {
        const exCard = document.createElement('div');
        exCard.className = 'bg-slate-800 rounded-xl overflow-hidden border border-slate-700/50';

        // Header
        exCard.innerHTML = `
            <div class="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <h3 class="font-bold text-sky-400 text-lg">${ex.name}</h3>
                <button class="text-slate-500 hover:text-white"><i class="ph ph-dots-three-vertical text-xl"></i></button>
            </div>
            <div class="p-2">
                <div class="grid grid-cols-10 gap-2 mb-2 text-xs text-slate-400 text-center font-bold uppercase tracking-wide">
                    <div class="col-span-1">Set</div>
                    <div class="col-span-3">lbs</div>
                    <div class="col-span-3">Reps</div>
                    <div class="col-span-3">✓</div>
                </div>
                <div id="sets-container-${index}" class="space-y-2">
                    <!-- Sets will be injected here -->
                </div>
                <button class="w-full mt-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-sky-400 font-bold flex items-center justify-center gap-2 transition-colors">
                    <i class="ph ph-plus"></i> Add Set
                </button>
            </div>
        `;

        // Render sets
        const setsContainer = exCard.querySelector(`#sets-container-${index}`);
        const targetSets = ex.targetSets || 3;

        for (let i = 1; i <= targetSets; i++) {
            const setRow = document.createElement('div');
            setRow.className = 'grid grid-cols-10 gap-2 items-center';
            setRow.innerHTML = `
                <div class="col-span-1 text-center font-bold text-slate-500 bg-slate-900/50 rounded py-2">${i}</div>
                <div class="col-span-3"><input type="number" placeholder="-" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-center text-white focus:border-sky-500 outline-none transition-colors"></div>
                <div class="col-span-3"><input type="number" placeholder="${ex.targetReps || '-'}" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-center text-white focus:border-sky-500 outline-none transition-colors"></div>
                <div class="col-span-3"><button class="w-full h-full bg-slate-700/50 hover:bg-green-600/20 text-slate-400 hover:text-green-400 border border-transparent hover:border-green-500/50 rounded transition-all flex items-center justify-center py-2"><i class="ph ph-check text-xl"></i></button></div>
            `;
            // Simple click toggle for set completion
            const checkBtn = setRow.querySelector('button');
            checkBtn.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                if (btn.classList.contains('bg-green-500')) {
                    // Uncheck
                    btn.classList.remove('bg-green-500', 'text-white', 'border-green-500');
                    btn.classList.add('bg-slate-700/50', 'text-slate-400', 'border-transparent');
                } else {
                    // Check
                    btn.classList.remove('bg-slate-700/50', 'text-slate-400', 'border-transparent');
                    btn.classList.add('bg-green-500', 'text-white', 'border-green-500');
                }
            });

            setsContainer.appendChild(setRow);
        }

        exerciseList.appendChild(exCard);
    });

    // "Add Exercise" button at the bottom
    const addExerciseBtn = document.createElement('button');
    addExerciseBtn.className = 'w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 font-bold hover:text-sky-400 hover:border-sky-500/50 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2';
    addExerciseBtn.innerHTML = `<i class="ph ph-plus text-xl"></i> Add Exercise`;
    exerciseList.appendChild(addExerciseBtn);

    wrapper.appendChild(exerciseList);

    // Finish Workout Button (Fixed at bottom)
    const footer = document.createElement('div');
    footer.className = 'fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent pointer-events-none';
    const finishBtn = document.createElement('button');
    finishBtn.className = 'w-full max-w-md mx-auto bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-900/30 flex items-center justify-center gap-2 pointer-events-auto transition-transform active:scale-[0.98]';
    finishBtn.innerHTML = `<i class="ph ph-check-circle text-xl"></i> Finish Workout`;
    finishBtn.addEventListener('click', async () => {
        // Mock finish
        if(confirm("Finish workout?")) {
            const newWorkout = {
                id: `log_${Date.now()}`,
                date: new Date().toISOString(),
                routineName: routine ? routine.name : "Custom Workout",
                durationMinutes: 45, // mock
                exercises: [] // mock empty
            };
            await service.saveWorkout(newWorkout);
            alert("Workout saved!");
            renderInGym(container, service); // Go back to start screen
        }
    });

    footer.appendChild(finishBtn);
    wrapper.appendChild(footer); // Note: this might need adjustment relative to `app-content`

    // To make fixed positioning work relative to the viewport but constrained to the max-w-md container if on desktop:
    // Actually, in the main layout, app-content is the scroll container.
    // The footer should probably be sticky or fixed.
    // Let's just append it to the wrapper and rely on the wrapper being in the scroll container.
    // But fixed bottom-20 is relative to viewport.
    // Correct way for this layout:
    // Use absolute positioning inside the main container if it's relative.

    container.appendChild(wrapper);
    container.appendChild(footer);
}
