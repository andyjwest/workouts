export class SheetService {
    constructor() {
        this.data = null;
        this.dbUrl = 'data/db.json';
    }

    async init() {
        if (!this.data) {
            await this.fetchData();
        }
    }

    async fetchData() {
        try {
            const response = await fetch(this.dbUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            console.log('Sheet data loaded:', this.data);
            return this.data;
        } catch (error) {
            console.error('Failed to fetch sheet data:', error);
            // Fallback for demo if fetch fails (e.g. local file restriction)
            this.data = { routines: [], workouts: [], exercises: [] };
            return this.data;
        }
    }

    getRoutines() {
        return this.data ? this.data.routines : [];
    }

    getWorkouts() {
        return this.data ? this.data.workouts : [];
    }

    getExercises() {
        return this.data ? this.data.exercises : [];
    }

    // Mimic saving data (in a real app this would POST to API)
    async saveWorkout(workout) {
        console.log('Saving workout to Sheet:', workout);
        if (!this.data.workouts) this.data.workouts = [];
        this.data.workouts.push(workout);
        // In a real app: await api.post('/workouts', workout);
        return true;
    }

    async saveRoutine(routine) {
        console.log('Saving routine to Sheet:', routine);
        if (!this.data.routines) this.data.routines = [];
        this.data.routines.push(routine);
        return true;
    }
}
