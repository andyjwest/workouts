export function renderPlanner(container, service) {
    const routines = service.getRoutines();

    const wrapper = document.createElement('div');
    wrapper.className = 'p-4 space-y-4 pb-20';

    // Header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-end mb-6';
    header.innerHTML = `
        <p class="text-slate-400 text-sm">Manage your training routines</p>
        <button id="create-routine-btn" class="bg-sky-600 hover:bg-sky-500 text-white p-2 rounded-lg shadow-lg transition-colors">
            <i class="ph ph-plus text-xl"></i>
        </button>
    `;
    wrapper.appendChild(header);

    // Routine List
    const list = document.createElement('div');
    list.className = 'space-y-4';

    if (routines.length === 0) {
        list.innerHTML = `<div class="text-center py-10 text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
            <i class="ph ph-clipboard-text text-4xl mb-2"></i>
            <p>No routines yet.</p>
        </div>`;
    } else {
        routines.forEach(routine => {
            const card = document.createElement('div');
            card.className = 'bg-slate-800 rounded-xl p-4 border border-slate-700/50 hover:border-sky-500/30 transition-colors group';

            const exercisePreview = routine.exercises.slice(0, 3).map(e => e.name).join(', ');
            const remainingCount = routine.exercises.length - 3;
            const previewText = remainingCount > 0 ? `${exercisePreview} +${remainingCount} more` : exercisePreview;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-slate-200">${routine.name}</h3>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="text-slate-400 hover:text-sky-400"><i class="ph ph-pencil-simple text-lg"></i></button>
                        <button class="text-slate-400 hover:text-red-400"><i class="ph ph-trash text-lg"></i></button>
                    </div>
                </div>
                <div class="text-sm text-slate-400 mb-3">
                    <p class="line-clamp-1">${previewText}</p>
                </div>
                <div class="flex gap-2 mt-2">
                    <span class="text-xs font-mono bg-slate-900 text-sky-400 px-2 py-1 rounded border border-slate-700">${routine.exercises.length} Exercises</span>
                    <span class="text-xs font-mono bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">Last: 2 days ago</span>
                </div>
            `;
            list.appendChild(card);
        });
    }
    wrapper.appendChild(list);

    container.appendChild(wrapper);

    // Event Listeners
    document.getElementById('create-routine-btn').addEventListener('click', () => {
        // Simple prompt for skeleton
        const name = prompt("Enter Routine Name:");
        if (name) {
            const newRoutine = {
                id: `routine_${Date.now()}`,
                name: name,
                exercises: []
            };
            service.saveRoutine(newRoutine).then(() => {
                renderPlanner(container, service); // Re-render
            });
        }
    });
}
