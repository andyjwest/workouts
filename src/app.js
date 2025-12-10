import { SheetService } from './services/SheetService.js';
import { renderInGym } from './views/InGymView.js';
import { renderPlanner } from './views/PlannerView.js';
import { renderReports } from './views/ReportsView.js';

class App {
    constructor() {
        this.service = new SheetService();
        this.currentView = 'gym'; // Default view
        this.contentEl = document.getElementById('app-content');
        this.headerTitleEl = document.getElementById('header-title');

        this.navButtons = {
            gym: document.getElementById('nav-gym'),
            planner: document.getElementById('nav-planner'),
            reports: document.getElementById('nav-reports')
        };
    }

    async init() {
        await this.service.init();
        this.setupNavigation();
        this.navigateTo('gym');
    }

    setupNavigation() {
        this.navButtons.gym.addEventListener('click', () => this.navigateTo('gym'));
        this.navButtons.planner.addEventListener('click', () => this.navigateTo('planner'));
        this.navButtons.reports.addEventListener('click', () => this.navigateTo('reports'));
    }

    updateActiveNav(viewName) {
        Object.keys(this.navButtons).forEach(key => {
            const btn = this.navButtons[key];
            if (key === viewName) {
                btn.classList.add('text-sky-400');
                btn.classList.remove('text-slate-400');
            } else {
                btn.classList.add('text-slate-400');
                btn.classList.remove('text-sky-400');
            }
        });
    }

    navigateTo(viewName) {
        this.currentView = viewName;
        this.updateActiveNav(viewName);
        this.contentEl.innerHTML = ''; // Clear content

        switch (viewName) {
            case 'gym':
                this.headerTitleEl.textContent = 'Active Workout';
                renderInGym(this.contentEl, this.service);
                break;
            case 'planner':
                this.headerTitleEl.textContent = 'Routine Planner';
                renderPlanner(this.contentEl, this.service);
                break;
            case 'reports':
                this.headerTitleEl.textContent = 'Progress Reports';
                renderReports(this.contentEl, this.service);
                break;
        }
    }
}

// Start the app
const app = new App();
app.init();
