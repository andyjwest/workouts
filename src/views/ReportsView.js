export function renderReports(container, service) {
    const workouts = service.getWorkouts();

    // Sort workouts by date desc
    workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const wrapper = document.createElement('div');
    wrapper.className = 'p-4 space-y-6 pb-20';

    // Stats Overview
    const statsGrid = document.createElement('div');
    statsGrid.className = 'grid grid-cols-2 gap-4';
    statsGrid.innerHTML = `
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
            <p class="text-xs text-slate-400 uppercase font-bold mb-1">Total Workouts</p>
            <p class="text-2xl font-bold text-white">${workouts.length}</p>
        </div>
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700/50">
            <p class="text-xs text-slate-400 uppercase font-bold mb-1">This Week</p>
            <p class="text-2xl font-bold text-emerald-400">1</p> <!-- Mock data -->
        </div>
    `;
    wrapper.appendChild(statsGrid);

    // Chart Area
    const chartCard = document.createElement('div');
    chartCard.className = 'bg-slate-800 p-4 rounded-xl border border-slate-700/50';
    chartCard.innerHTML = `
        <h3 class="text-sm font-bold text-slate-200 mb-4">Volume History</h3>
        <div class="h-48 relative w-full">
            <canvas id="reports-chart"></canvas>
        </div>
    `;
    wrapper.appendChild(chartCard);

    // Recent History
    const historySection = document.createElement('div');
    historySection.innerHTML = `<h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Recent History</h3>`;

    const historyList = document.createElement('div');
    historyList.className = 'space-y-3';

    workouts.forEach(workout => {
        const date = new Date(workout.date);
        const card = document.createElement('div');
        card.className = 'bg-slate-800 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center';
        card.innerHTML = `
            <div>
                <p class="font-bold text-white">${workout.routineName}</p>
                <p class="text-xs text-slate-400">${date.toLocaleDateString()} • ${workout.durationMinutes} min</p>
            </div>
            <div class="text-right">
                <p class="text-sm font-bold text-sky-400">${workout.exercises.length} Exercises</p>
            </div>
        `;
        historyList.appendChild(card);
    });

    historySection.appendChild(historyList);
    wrapper.appendChild(historySection);

    container.appendChild(wrapper);

    // Initialize Chart
    setTimeout(() => {
        const ctx = document.getElementById('reports-chart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Volume (lbs)',
                        data: [12000, 19000, 3000, 5000, 2000, 30000, 45000], // Mock data
                        backgroundColor: '#38bdf8',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
                        y: { display: false }
                    }
                }
            });
        }
    }, 0);
}
