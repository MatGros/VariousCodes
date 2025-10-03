// ============================================================================
// DIMCABLE MGS-05 - Dimensionnement de Câbles Électriques
// Version Pure JavaScript (sans framework)
// ============================================================================

// --- DATABASE: Cable & Norms Data ---
const CABLE_DATABASE = {
    resistivity: { Cu: 0.0172, Al: 0.0282 },
    sections: [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240],
    data: {
        'U-1000 R2V': {
            'Cu': {
                1.5: [12.1, 0.08, 20, 28, 8.5],
                2.5: [7.41, 0.08, 27, 37, 9.5],
                4: [4.61, 0.08, 37, 49, 10.5],
                6: [3.08, 0.08, 48, 62, 11.5],
                10: [1.83, 0.08, 66, 84, 13.5],
                16: [1.15, 0.08, 89, 109, 15.5],
                25: [0.727, 0.078, 119, 141, 18],
                35: [0.524, 0.078, 148, 171, 20],
                50: [0.387, 0.077, 179, 202, 23],
                70: [0.268, 0.076, 228, 251, 26],
                95: [0.193, 0.075, 279, 299, 30],
                120: [0.153, 0.075, 323, 340, 33],
                150: [0.124, 0.074, 372, 385, 36],
                185: [0.0991, 0.074, 429, 434, 40],
                240: [0.0754, 0.073, 506, 498, 45],
            }
        },
        'HO7RNF': {
            'Cu': {
                1.5: [13.3, 0.09, 19, 25, 9.8],
                2.5: [8.21, 0.09, 26, 34, 11.5],
                4: [5.09, 0.09, 34, 45, 13.1],
                6: [3.39, 0.08, 44, 57, 14.8],
                10: [1.95, 0.08, 61, 78, 18.2],
                16: [1.21, 0.08, 82, 102, 21.0],
            }
        },
    }
};

const CORRECTION_FACTORS = {
    temperature: { 20: 1.12, 25: 1.06, 30: 1.0, 35: 0.94, 40: 0.87, 45: 0.79 },
    grouping: { 1: 1.0, 2: 0.8, 3: 0.7, 4: 0.65, '5+': 0.6 },
    installation: {
        'Chemin de câbles perforé': 1.0,
        'Chemin de câbles non perforé': 0.95,
        'Enterré direct': 1.0,
        'Sous conduit apparent': 0.9,
        'Sous goulotte': 0.85,
        'En vide de construction': 0.8
    },
};

const BREAKER_RATINGS = {
    1.5: 16, 2.5: 20, 4: 25, 6: 32, 10: 50, 16: 63, 25: 80, 35: 100,
    50: 125, 70: 160, 95: 200, 120: 250, 150: 250, 185: 320, 240: 400
};

// --- GLOBAL STATE ---
let currentMode = 'section';
let inputs = {};
let calculationResults = {};
let charts = {
    main: null,
    secondary: null
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Configure Chart.js default font settings for better readability
    if (window.Chart) {
        Chart.defaults.font.size = 15;
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif';
        Chart.defaults.font.weight = '500';
        Chart.defaults.color = '#d1d5db'; // gray-300

        // Better spacing for tick labels
        Chart.defaults.scale.ticks.padding = 8;
        Chart.defaults.plugins.legend.labels.padding = 15;
        Chart.defaults.plugins.legend.labels.font = {
            size: 15,
            weight: '600'
        };
    }

    initializeApp();
    attachEventListeners();
    loadStateFromLocalStorage();
    updateUI();
    calculate();
});

function initializeApp() {
    // Populate section selects
    const sectionSelects = [document.getElementById('givenSection'), document.getElementById('givenSectionMode3')];
    sectionSelects.forEach(select => {
        CABLE_DATABASE.sections.forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            if (s === 6) option.selected = true;
            select.appendChild(option);
        });
    });

    // Initialize default values
    inputs = getDefaultInputs();
}

function getDefaultInputs() {
    const initialPower = (230 * 32 * 0.9) / 1000;
    return {
        cableType: 'U-1000 R2V',
        conductors: '3G',
        material: 'Cu',
        voltage: 230,
        customVoltage: '',
        isMotorMode: false,
        powerFactor: 0.9,
        current: 32,
        power: parseFloat(initialPower.toFixed(2)),
        distance: 50,
        frequency: 50,
        installation: 'Chemin de câbles perforé',
        temperature: 30,
        circuits: 1,
        givenSection: 6,
        maxVoltageDrop: 3,
    };
}

// --- EVENT LISTENERS ---
function attachEventListeners() {
    // Mode tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            currentMode = e.target.dataset.mode;
            updateTabsUI();
            updateModeInputsVisibility();
            calculate();
        });
    });

    // Input changes
    const inputElements = [
        'cableType', 'conductors', 'material', 'voltage', 'customVoltage',
        'isMotorMode', 'powerFactor', 'current', 'power', 'distance',
        'installation', 'temperature', 'circuits', 'givenSection',
        'givenSectionMode3', 'maxVoltageDrop', 'currentMode2'
    ];

    inputElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', handleInputChange);
            el.addEventListener('input', handleInputChange);
        }
    });

    // Power factor slider display
    document.getElementById('powerFactor').addEventListener('input', (e) => {
        document.getElementById('powerFactorValue').textContent = parseFloat(e.target.value).toFixed(2);
    });

    // Buttons
    document.getElementById('btnReset').addEventListener('click', resetApp);
    document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
    document.getElementById('btnExportPDF').addEventListener('click', exportPDF);
    document.getElementById('expertToggle').addEventListener('change', toggleExpertMode);
}

function handleInputChange(e) {
    const { id, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    // Parse numeric values
    const numericFields = ['voltage', 'powerFactor', 'current', 'power', 'distance', 'givenSection', 'givenSectionMode3', 'maxVoltageDrop', 'customVoltage', 'currentMode2', 'temperature', 'circuits'];
    if (numericFields.includes(id)) {
        finalValue = parseFloat(finalValue);
        if (isNaN(finalValue)) finalValue = 0;
    }

    // Map UI IDs to state keys
    const idMap = {
        'currentMode2': 'current',
        'givenSectionMode3': 'givenSection'
    };
    const stateKey = idMap[id] || id;

    inputs[stateKey] = finalValue;

    // Synchronization logic
    if (id === 'isMotorMode') {
        inputs.maxVoltageDrop = finalValue ? 5 : 3;
        document.getElementById('maxVoltageDrop').value = inputs.maxVoltageDrop;
    }

    if (id === 'maxVoltageDrop') {
        inputs.isMotorMode = (finalValue === 5);
        document.getElementById('isMotorMode').checked = inputs.isMotorMode;
    }

    // Auto-calculate power from current
    if (id === 'current' || id === 'currentMode2') {
        const V = inputs.voltage === 0 ? inputs.customVoltage : inputs.voltage;
        const cosPhi = inputs.powerFactor;
        const isThreePhase = V === 400 || inputs.conductors.startsWith('4G') || inputs.conductors.startsWith('5G');
        const powerKVA = isThreePhase ? (V * finalValue * Math.sqrt(3)) / 1000 : (V * finalValue) / 1000;
        inputs.power = parseFloat((powerKVA * cosPhi).toFixed(2));
        document.getElementById('power').value = inputs.power;
    }

    // Auto-calculate current from power
    if (id === 'power') {
        const V = inputs.voltage === 0 ? inputs.customVoltage : inputs.voltage;
        const cosPhi = inputs.powerFactor;
        const isThreePhase = V === 400 || inputs.conductors.startsWith('4G') || inputs.conductors.startsWith('5G');
        if (V > 0 && cosPhi > 0) {
            const denominator = isThreePhase ? (V * Math.sqrt(3) * cosPhi) : (V * cosPhi);
            inputs.current = parseFloat((finalValue * 1000 / denominator).toFixed(2));
            document.getElementById('current').value = inputs.current;
            document.getElementById('currentMode2').value = inputs.current;
        }
    }

    // Show/hide custom voltage
    if (id === 'voltage') {
        document.getElementById('customVoltage').classList.toggle('hidden', finalValue != 0);
    }

    saveStateToLocalStorage();
    calculate();
}

// --- UI UPDATES ---
function updateUI() {
    updateTabsUI();
    updateModeInputsVisibility();
    updateFormValues();
}

function updateTabsUI() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === currentMode);
    });
}

function updateModeInputsVisibility() {
    // Hide all mode-specific inputs
    document.querySelectorAll('.mode-inputs').forEach(el => el.classList.add('hidden'));

    // Show current mode inputs
    document.querySelector(`.mode-${currentMode}`).classList.remove('hidden');

    // Distance visibility (hidden only in mode distance)
    const distanceInput = document.querySelector('.distance-input');
    distanceInput.classList.toggle('hidden', currentMode === 'distance');
}

function updateFormValues() {
    // Restore form values from state
    Object.keys(inputs).forEach(key => {
        const el = document.getElementById(key);
        if (el) {
            if (el.type === 'checkbox') {
                el.checked = inputs[key];
            } else {
                el.value = inputs[key];
            }
        }
    });

    // Update power factor display
    document.getElementById('powerFactorValue').textContent = inputs.powerFactor.toFixed(2);

    // Custom voltage visibility
    document.getElementById('customVoltage').classList.toggle('hidden', inputs.voltage != 0);

    // Sync mode 2 current
    document.getElementById('currentMode2').value = inputs.current;

    // Sync mode 3 section
    document.getElementById('givenSectionMode3').value = inputs.givenSection;
}

// --- CALCULATION ENGINE ---
function calculate() {
    const V = inputs.voltage === 0 ? inputs.customVoltage : inputs.voltage;

    if (currentMode !== 'distance' && (!inputs.current || !inputs.distance)) {
        calculationResults = { error: "Courant et distance requis." };
        renderResults();
        return;
    }

    if (currentMode === 'distance' && !inputs.current) {
        calculationResults = { error: "Courant requis." };
        renderResults();
        return;
    }

    if (V === 0) {
        calculationResults = { error: "Tension requise." };
        renderResults();
        return;
    }

    const isThreePhase = V === 400 || inputs.conductors.startsWith('4G') || inputs.conductors.startsWith('5G');
    const maxVdPercent = inputs.isMotorMode ? 5 : (inputs.maxVoltageDrop || 3);
    const K_temp = CORRECTION_FACTORS.temperature[inputs.temperature] || 1.0;
    const K_group = CORRECTION_FACTORS.grouping[inputs.circuits] || CORRECTION_FACTORS.grouping['5+'];
    const K_pose = CORRECTION_FACTORS.installation[inputs.installation] || 1.0;
    const K_total = K_temp * K_group * K_pose;
    const sinPhi = Math.sqrt(1 - inputs.powerFactor**2);

    const getSectionData = (section) => {
        const data = CABLE_DATABASE.data[inputs.cableType]?.[inputs.material];
        if (!data || !data[section]) return null;
        const [res, rea, izAir, izBuried, extDiameter] = data[section];
        const izBase = inputs.installation === 'Enterré direct' ? izBuried : izAir;
        const izCorrected = izBase * K_total;
        return { res, rea, izCorrected, extDiameter };
    };

    const calculateVoltageDrop = (sectionData, dist, curr) => {
        if (!sectionData) return { dU: Infinity, dU_percent: Infinity };
        const R = sectionData.res / 1000;
        const X = sectionData.rea / 1000;
        const phaseFactor = isThreePhase ? Math.sqrt(3) : 2;
        const dU = phaseFactor * dist * curr * (R * inputs.powerFactor + X * sinPhi);
        const dU_percent = (dU / V) * 100;
        return { dU, dU_percent };
    };

    // MODE 1: Calculate Section
    if (currentMode === 'section') {
        let minimalSection = null;
        let recommendedSection = null;
        const resultsBySection = {};

        for (const section of CABLE_DATABASE.sections) {
            const sectionData = getSectionData(section);
            if (!sectionData) continue;

            const { dU, dU_percent } = calculateVoltageDrop(sectionData, inputs.distance, inputs.current);
            const thermalOk = sectionData.izCorrected >= inputs.current;
            const vdOk = dU_percent <= maxVdPercent;

            resultsBySection[section] = { ...sectionData, dU, dU_percent, thermalOk, vdOk };

            if (thermalOk && vdOk && !minimalSection) {
                minimalSection = section;
            }
        }

        if (minimalSection) {
            const minimalIndex = CABLE_DATABASE.sections.indexOf(minimalSection);
            recommendedSection = CABLE_DATABASE.sections[minimalIndex + 1] || minimalSection;
        }

        // Graph data
        const sections = CABLE_DATABASE.sections.filter(s => s >= (minimalSection || 1.5)).slice(0, 4);
        const graphData = Array.from({ length: 11 }, (_, i) => {
            const dist = (inputs.distance * 2 / 10) * i;
            const point = { distance: parseFloat(dist.toFixed(1)) };

            sections.forEach(s => {
                const sectionData = getSectionData(s);
                const { dU_percent } = calculateVoltageDrop(sectionData, dist, inputs.current);
                point[`${s}mm²`] = parseFloat(dU_percent.toFixed(2));
            });

            return point;
        });

        calculationResults = {
            mode: currentMode,
            minimalSection,
            recommendedSection,
            details: resultsBySection[recommendedSection || minimalSection],
            allDetails: resultsBySection,
            graphData,
            graphSections: sections,
            K_total,
        };
    }

    // MODE 2: Calculate Max Distance
    if (currentMode === 'distance') {
        const sectionData = getSectionData(inputs.givenSection);
        if (!sectionData) {
            calculationResults = { error: `Données non trouvées pour la section ${inputs.givenSection}mm²` };
            renderResults();
            return;
        }

        const R = sectionData.res / 1000;
        const X = sectionData.rea / 1000;
        const phaseFactor = isThreePhase ? Math.sqrt(3) : 2;
        const maxDU_volts = V * (maxVdPercent / 100);

        const L_max_vd = inputs.current > 0 ? (maxDU_volts / (phaseFactor * inputs.current * (R * inputs.powerFactor + X * sinPhi))) : Infinity;
        const thermalOk = sectionData.izCorrected >= inputs.current;
        const maxDistance = thermalOk ? L_max_vd : 0;

        const graphMaxDist = isFinite(maxDistance) && maxDistance > 0 ? maxDistance * 1.25 : 200;
        const maxYScale = sectionData.izCorrected * 3;

        const graphData = Array.from({length: 21}, (_, i) => {
            const dist = i === 0 ? graphMaxDist / 100 : (graphMaxDist / 20) * i;
            const iMaxVd = maxDU_volts / (phaseFactor * dist * (R * inputs.powerFactor + X * sinPhi));
            const limitedIMaxVd = Math.min(iMaxVd, maxYScale);
            return {
                distance: i === 0 ? 0 : parseFloat(dist.toFixed(1)),
                vdLimit: parseFloat(limitedIMaxVd.toFixed(2)),
            }
        });

        const vdGraphData = Array.from({length: 21}, (_, i) => {
            const dist = (graphMaxDist / 20) * i;
            const dU = phaseFactor * dist * inputs.current * (R * inputs.powerFactor + X * sinPhi);
            const dU_percent = (dU / V) * 100;
            return {
                distance: parseFloat(dist.toFixed(1)),
                vdPercent: parseFloat(dU_percent.toFixed(2)),
            }
        });

        calculationResults = {
            mode: currentMode,
            maxDistance,
            thermalOk,
            izCorrected: sectionData.izCorrected,
            graphData,
            maxYScale,
            vdGraphData,
            K_total,
        };
    }

    // MODE 3: Calculate Max Current
    if (currentMode === 'current') {
        const sectionData = getSectionData(inputs.givenSection);
        if (!sectionData) {
            calculationResults = { error: `Données non trouvées pour la section ${inputs.givenSection}mm²` };
            renderResults();
            return;
        }

        const maxCurrentThermal = sectionData.izCorrected;

        const R = sectionData.res / 1000;
        const X = sectionData.rea / 1000;
        const phaseFactor = isThreePhase ? Math.sqrt(3) : 2;
        const maxDU_volts = V * (maxVdPercent / 100);

        const maxCurrentVD = maxDU_volts / (phaseFactor * inputs.distance * (R * inputs.powerFactor + X * sinPhi));
        const maxCurrentFinal = Math.min(maxCurrentThermal, maxCurrentVD);

        const scc_1s = inputs.givenSection * 115;

        const maxPracticalDist = inputs.distance * 2;
        const maxYScale = maxCurrentThermal * 3;
        const graphData = Array.from({length: 21}, (_, i) => {
            const dist = i === 0 ? maxPracticalDist / 100 : (maxPracticalDist / 20) * i;
            const iMaxVd = maxDU_volts / (phaseFactor * dist * (R * inputs.powerFactor + X * sinPhi));
            const limitedIMaxVd = Math.min(iMaxVd, maxYScale);
            return {
                distance: i === 0 ? 0 : parseFloat(dist.toFixed(1)),
                maxCurrentThermal: parseFloat(maxCurrentThermal.toFixed(2)),
                maxCurrentVD: parseFloat(limitedIMaxVd.toFixed(2)),
            }
        });

        calculationResults = {
            mode: currentMode,
            maxCurrentThermal,
            maxCurrentVD,
            maxCurrentFinal,
            scc_1s,
            graphData,
            maxYScale,
            K_total,
        };
    }

    renderResults();
}

// --- RENDER RESULTS ---
function renderResults() {
    const resultsContent = document.getElementById('results-content');
    const recommendationsContent = document.getElementById('recommendations-content');

    if (calculationResults.error) {
        resultsContent.innerHTML = `<div class="alert alert-error">${calculationResults.error}</div>`;
        recommendationsContent.innerHTML = '<p class="text-muted">En attente de calculs valides...</p>';
        return;
    }

    if (currentMode === 'section') {
        renderMode1Results(resultsContent, recommendationsContent);
    } else if (currentMode === 'distance') {
        renderMode2Results(resultsContent, recommendationsContent);
    } else if (currentMode === 'current') {
        renderMode3Results(resultsContent, recommendationsContent);
    }

    renderRecommendations(recommendationsContent);
    updateExpertPanel();
}

function renderMode1Results(container) {
    const res = calculationResults;

    let html = `
        <div class="result-cards">
            <div class="result-card ${res.minimalSection ? 'card-success' : 'card-error'}">
                <div class="card-label">Section Minimale Normative</div>
                <div class="card-value">${res.minimalSection ? res.minimalSection + ' mm²' : 'Non conforme'}</div>
            </div>
            <div class="result-card ${res.recommendedSection ? 'card-success' : 'card-error'}">
                <div class="card-label">Section Recommandée</div>
                <div class="card-value">${res.recommendedSection ? res.recommendedSection + ' mm²' : 'Non conforme'}</div>
            </div>
        </div>
    `;

    if (res.details) {
        const power = ((res.details.res / 1000) * inputs.distance * inputs.current**2).toFixed(0);
        html += `
            <div class="info-chips">
                <div class="info-chip">
                    <div class="chip-label">Chute de Tension</div>
                    <div class="chip-value">${res.details.dU.toFixed(2)}V (${res.details.dU_percent.toFixed(2)}%)</div>
                </div>
                <div class="info-chip">
                    <div class="chip-label">Courant Admissible Iz'</div>
                    <div class="chip-value">${res.details.izCorrected.toFixed(1)}A</div>
                </div>
                <div class="info-chip">
                    <div class="chip-label">Puissance Dissipée</div>
                    <div class="chip-value">${power} W</div>
                </div>
            </div>
        `;
    }

    html += `
        <h3>Chute de Tension vs Distance</h3>
        <canvas id="chart-main"></canvas>
    `;

    container.innerHTML = html;

    // Render chart
    renderMode1Chart();
}

function renderMode2Results(container) {
    const res = calculationResults;

    let html = `
        <div class="result-cards">
            <div class="result-card ${res.maxDistance > 0 ? 'card-success' : 'card-error'}">
                <div class="card-label">Distance Maximale Admissible</div>
                <div class="card-value">${res.maxDistance ? res.maxDistance.toFixed(1) + ' m' : 'Courant trop élevé'}</div>
            </div>
        </div>
    `;

    if (!res.thermalOk) {
        html += `<div class="alert alert-error">Le courant de ${inputs.current}A dépasse le courant admissible (${res.izCorrected.toFixed(1)}A) pour cette section.</div>`;
    }

    html += `
        <h3>Chute de Tension vs Distance</h3>
        <canvas id="chart-main"></canvas>
        <h3>Zone de Sécurité Opérationnelle</h3>
        <canvas id="chart-secondary"></canvas>
    `;

    container.innerHTML = html;

    renderMode2Charts();
}

function renderMode3Results(container) {
    const res = calculationResults;

    let html = `
        <div class="result-cards">
            <div class="result-card card-success">
                <div class="card-label">Courant Max Final</div>
                <div class="card-value">${res.maxCurrentFinal.toFixed(1)} A</div>
            </div>
            <div class="result-card card-info">
                <div class="card-label">Icc Admissible (1s)</div>
                <div class="card-value">${res.scc_1s.toFixed(0)} A</div>
            </div>
        </div>
        <div class="info-chips">
            <div class="info-chip">
                <div class="chip-label">Limite Thermique (Iz')</div>
                <div class="chip-value">${res.maxCurrentThermal.toFixed(1)} A</div>
            </div>
            <div class="info-chip">
                <div class="chip-label">Limite Chute Tension</div>
                <div class="chip-value">${res.maxCurrentVD.toFixed(1)} A</div>
            </div>
        </div>
        <h3>Courant Maximal vs Distance</h3>
        <canvas id="chart-main"></canvas>
    `;

    container.innerHTML = html;

    renderMode3Chart();
}

// --- CHARTS RENDERING ---
function renderMode1Chart() {
    destroyCharts();

    const ctx = document.getElementById('chart-main');
    if (!ctx) return;

    const res = calculationResults;
    const datasets = res.graphSections.map((section, i) => {
        const colors = ['#34d399', '#60a5fa', '#f87171', '#fbbf24'];
        return {
            label: `${section}mm²`,
            data: res.graphData.map(d => ({ x: d.distance, y: d[`${section}mm²`] })),
            borderColor: colors[i % 4],
            backgroundColor: colors[i % 4],
            borderWidth: 2,
            pointRadius: 0,
        };
    });

    charts.main = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        padding: 15,
                        font: {
                            size: 20,
                            weight: '600'
                        },
                        boxWidth: 40,
                        boxHeight: 3
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { size: 20, weight: '600' },
                    bodyFont: { size: 20 },
                    padding: 12,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distance (m)',
                        font: { size: 20, weight: '600' },
                        padding: { top: 10 }
                    },
                    ticks: {
                        font: { size: 20 },
                        padding: 8
                    },
                    min: 0
                },
                y: {
                    title: {
                        display: true,
                        text: 'Chute de tension (%)',
                        font: { size: 20, weight: '600' },
                        padding: { bottom: 10 }
                    },
                    ticks: {
                        font: { size: 20 },
                        padding: 8
                    },
                    min: 0
                }
            }
        }
    });
}

function renderMode2Charts() {
    destroyCharts();

    const res = calculationResults;
    const maxVd = inputs.maxVoltageDrop;

    // Voltage drop chart
    const ctx1 = document.getElementById('chart-main');
    if (ctx1) {
        charts.main = new Chart(ctx1, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Chute de tension',
                    data: res.vdGraphData.map(d => ({ x: d.distance, y: d.vdPercent })),
                    borderColor: '#60a5fa',
                    backgroundColor: '#60a5fa',
                    borderWidth: 2,
                    pointRadius: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 10,
                        right: 20,
                        top: 10,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            padding: 15,
                            font: { size: 20, weight: '600' },
                            boxWidth: 40,
                            boxHeight: 3
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { size: 20, weight: '600' },
                        bodyFont: { size: 20 },
                        padding: 12
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: maxVd,
                                yMax: maxVd,
                                borderColor: '#f87171',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: `Limite ${maxVd}%`,
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Distance (m)',
                            font: { size: 20, weight: '600' },
                            padding: { top: 10 }
                        },
                        ticks: {
                            font: { size: 14 },
                            padding: 8
                        },
                        min: 0
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Chute de tension (%)',
                            font: { size: 20, weight: '600' },
                            padding: { bottom: 10 }
                        },
                        ticks: {
                            font: { size: 20 },
                            padding: 8
                        },
                        min: 0
                    }
                }
            }
        });
    }

    // Safety zone chart
    const ctx2 = document.getElementById('chart-secondary');
    if (ctx2) {
        charts.secondary = new Chart(ctx2, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Limite par Chute de Tension',
                    data: res.graphData.map(d => ({ x: d.distance, y: d.vdLimit })),
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 10,
                        right: 20,
                        top: 10,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            padding: 15,
                            font: { size: 20, weight: '600' },
                            boxWidth: 40,
                            boxHeight: 3
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { size: 20, weight: '600' },
                        bodyFont: { size: 20 },
                        padding: 12
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: maxVd,
                                yMax: maxVd,
                                borderColor: '#f87171',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: `Limite ${maxVd}%`,
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Distance (m)', font: { size: 20, weight: '600' } },
                        ticks: { font: { size: 20 } },
                        min: 0
                    },
                    y: {
                        title: { display: true, text: 'Courant (A)', font: { size: 20, weight: '600' } },
                        ticks: { font: { size: 20 } },
                        min: 0,
                        max: res.maxYScale
                    }
                }
            }
        });
    }
}

function renderMode3Chart() {
    destroyCharts();

    const ctx = document.getElementById('chart-main');
    if (!ctx) return;

    const res = calculationResults;

    charts.main = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Limite Thermique',
                    data: res.graphData.map(d => ({ x: d.distance, y: d.maxCurrentThermal })),
                    borderColor: '#f87171',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0,
                },
                {
                    label: 'Limite Chute Tension',
                    data: res.graphData.map(d => ({ x: d.distance, y: d.maxCurrentVD })),
                    borderColor: '#60a5fa',
                    borderWidth: 2,
                    pointRadius: 0,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Distance (m)', font: { size: 20, weight: '600' } },
                    ticks: { font: { size: 20 } },
                    min: 0
                },
                y: {
                    title: { display: true, text: 'Courant maximal (A)', font: { size: 20, weight: '600' } },
                    ticks: { font: { size: 20 } },
                    min: 0,
                    max: res.maxYScale
                }
            }
        }
    });
}

function destroyCharts() {
    if (charts.main) {
        charts.main.destroy();
        charts.main = null;
    }
    if (charts.secondary) {
        charts.secondary.destroy();
        charts.secondary = null;
    }
}

// --- RECOMMENDATIONS ---
function renderRecommendations(container) {
    const res = calculationResults;
    if (!res || res.error) {
        container.innerHTML = '<p class="text-muted">En attente de calculs valides...</p>';
        return;
    }

    const section = res.recommendedSection || inputs.givenSection;
    if (!section) return;

    let details;
    let vdPercent;

    if (res.mode === 'section' && res.details) {
        details = res.details;
        vdPercent = details.dU_percent;
    } else {
        const sectionData = CABLE_DATABASE.data[inputs.cableType]?.[inputs.material]?.[section];
        if (!sectionData) return;
        details = { extDiameter: sectionData[4] };
        vdPercent = undefined;
    }

    const breaker = BREAKER_RATINGS[section] || 'N/A';
    const isTempHigh = inputs.temperature > 35;
    const maxVd = (currentMode === 'distance' || currentMode === 'current') ? inputs.maxVoltageDrop : (inputs.isMotorMode ? 5 : 3);
    const isVdHigh = vdPercent > maxVd;
    const isVdWarning = vdPercent >= maxVd * 0.95 && vdPercent <= maxVd;

    let html = '<div class="recommendations">';

    if (vdPercent !== undefined && currentMode === 'section') {
        const alertType = isVdHigh ? 'error' : (isVdWarning ? 'warning' : 'success');
        const title = isVdHigh ? "Chute de tension trop élevée" : "Chute de tension conforme";
        const message = `La chute de tension est de ${vdPercent.toFixed(2)}%. La norme recommande ${maxVd}%.`;
        html += `<div class="alert alert-${alertType}"><strong>${title}</strong><br>${message}</div>`;
    }

    if (isTempHigh) {
        html += `<div class="alert alert-warning"><strong>Température Ambiante Élevée</strong><br>Un dérating thermique a été appliqué.</div>`;
    }

    html += `
        <h3>Protection Recommandée</h3>
        <div class="reco-item">
            <span>Calibre Disjoncteur</span>
            <span>${breaker}A (Courbe C/D)</span>
        </div>
        <div class="reco-item">
            <span>Protection Différentielle</span>
            <span>30mA Type A/AC/F</span>
        </div>

        <h3>Informations de Pose</h3>
        <div class="reco-item">
            <span>Référence Commerciale Type</span>
            <span>${inputs.cableType} ${inputs.conductors}${section}mm²</span>
        </div>
        <div class="reco-item">
            <span>Diamètre Extérieur approx.</span>
            <span>${details.extDiameter || 'N/A'} mm</span>
        </div>
        <div class="reco-item">
            <span>Rayon de Courbure Min.</span>
            <span>${details.extDiameter ? (details.extDiameter * 8).toFixed(0) : 'N/A'} mm</span>
        </div>
        <div class="reco-item">
            <span>Fixation Recommandée</span>
            <span>Colliers tous les 40-60 cm</span>
        </div>
        <div class="reco-item">
            <span>Norme de Référence</span>
            <span>NF C 15-100, IEC 60364</span>
        </div>
    `;

    html += '</div>';
    container.innerHTML = html;
}

// --- EXPERT PANEL ---
function updateExpertPanel() {
    const expertContent = document.getElementById('expert-content');
    if (!expertContent) return;

    const res = calculationResults;
    if (!res || res.error) {
        expertContent.textContent = '';
        return;
    }

    const K_temp = CORRECTION_FACTORS.temperature[inputs.temperature];
    const K_group = CORRECTION_FACTORS.grouping[inputs.circuits] || CORRECTION_FACTORS.grouping['5+'];
    const K_pose = CORRECTION_FACTORS.installation[inputs.installation];

    let text = `> Coefficients Correcteurs :
  K_temp (${inputs.temperature}°C) = ${K_temp}
  K_group (${inputs.circuits} circuits) = ${K_group}
  K_pose (${inputs.installation}) = ${K_pose}
  K_total = ${K_temp} × ${K_group} × ${K_pose} = ${res.K_total?.toFixed(3)}

> Formule Chute de Tension (ΔU) :
  ΔU = ${inputs.voltage === 400 ? '√3' : '2'} × L × I × (R·cosφ + X·sinφ)
`;

    if (res.mode === 'section' && res.details && res.recommendedSection) {
        const V = inputs.voltage === 0 ? inputs.customVoltage : inputs.voltage;
        const izBase = CABLE_DATABASE.data[inputs.cableType][inputs.material][res.recommendedSection][inputs.installation === 'Enterré direct' ? 3 : 2];
        text += `
> Calcul pour section ${res.recommendedSection} mm² :
  Iz_base = ${izBase} A
  Iz' (corrigé) = Iz_base × K_total = ${res.details.izCorrected.toFixed(2)} A
  Condition thermique: ${res.details.izCorrected.toFixed(2)}A (Iz') >= ${inputs.current}A (I) -> ${res.details.thermalOk ? 'OK' : 'KO'}
  ΔU = ${res.details.dU.toFixed(2)} V (${res.details.dU_percent.toFixed(2)}%)
  Condition ΔU: ${res.details.dU_percent.toFixed(2)}% <= ${inputs.isMotorMode ? 5 : 3}% -> ${res.details.vdOk ? 'OK' : 'KO'}
`;
    }

    expertContent.textContent = text;
}

function toggleExpertMode(e) {
    document.getElementById('expert-panel').classList.toggle('hidden', !e.target.checked);
}

// --- LOCAL STORAGE ---
function saveStateToLocalStorage() {
    try {
        localStorage.setItem('cableSizerState', JSON.stringify(inputs));
    } catch (error) {
        console.error("Failed to save state to localStorage", error);
    }
}

function loadStateFromLocalStorage() {
    try {
        const savedState = localStorage.getItem('cableSizerState');
        if (savedState) {
            inputs = JSON.parse(savedState);
            updateFormValues();
        }
    } catch (error) {
        console.error("Failed to load state from localStorage", error);
    }
}

// --- RESET ---
function resetApp() {
    localStorage.removeItem('cableSizerState');
    inputs = getDefaultInputs();
    updateFormValues();
    calculate();
}

// --- EXPORT FUNCTIONS ---
function exportCSV() {
    const res = calculationResults;
    const V = inputs.voltage === 0 ? inputs.customVoltage : inputs.voltage;
    const isThreePhase = V === 400 || inputs.conductors.startsWith('4G') || inputs.conductors.startsWith('5G');
    const modeNames = { section: 'Calcul de Section', distance: 'Distance Maximale', current: 'Courant Maximal' };

    let data = [
        ["DIMENSIONNEMENT DE CÂBLE ÉLECTRIQUE", "", ""],
        ["Généré le", new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR'), ""],
        ["", "", ""],
        ["=== PARAMÈTRES D'ENTRÉE ===", "", ""],
        ["Mode de calcul", modeNames[currentMode], ""],
        ["", "", ""],
        ["Type de câble", inputs.cableType, ""],
        ["Nombre de conducteurs", inputs.conductors, ""],
        ["Matériau conducteur", inputs.material === 'Cu' ? 'Cuivre' : 'Aluminium', ""],
        ["Tension nominale", V, "V"],
        ["Type réseau", isThreePhase ? "Triphasé" : "Monophasé", ""],
        ["Mode moteur", inputs.isMotorMode ? "Oui (5%)" : "Non (3%)", ""],
        ["Facteur de puissance (cos φ)", inputs.powerFactor, ""],
        ["", "", ""],
    ];

    if (currentMode === 'section') {
        data.push(["Courant", inputs.current, "A"]);
        data.push(["Puissance", inputs.power, "kW"]);
        data.push(["Distance", inputs.distance, "m"]);
    } else if (currentMode === 'distance') {
        data.push(["Section spécifiée", inputs.givenSection, "mm²"]);
        data.push(["Courant", inputs.current, "A"]);
        data.push(["Chute de tension max", inputs.maxVoltageDrop, "%"]);
    } else if (currentMode === 'current') {
        data.push(["Section spécifiée", inputs.givenSection, "mm²"]);
        data.push(["Distance", inputs.distance, "m"]);
    }

    data.push(["", "", ""]);
    data.push(["Mode de pose", inputs.installation, ""]);
    data.push(["Température ambiante", inputs.temperature, "°C"]);
    data.push(["Circuits adjacents", inputs.circuits, ""]);

    if (res.K_total) {
        const K_temp = CORRECTION_FACTORS.temperature[inputs.temperature] || 1.0;
        const K_group = CORRECTION_FACTORS.grouping[inputs.circuits] || CORRECTION_FACTORS.grouping['5+'];
        const K_pose = CORRECTION_FACTORS.installation[inputs.installation] || 1.0;

        data.push(["", "", ""]);
        data.push(["=== COEFFICIENTS CORRECTEURS ===", "", ""]);
        data.push(["Coefficient température", K_temp, ""]);
        data.push(["Coefficient groupement", K_group, ""]);
        data.push(["Coefficient mode de pose", K_pose, ""]);
        data.push(["Coefficient total (K)", res.K_total.toFixed(3), ""]);
    }

    data.push(["", "", ""]);
    data.push(["=== RÉSULTATS DE CALCUL ===", "", ""]);

    if (res.mode === 'section' && res.recommendedSection && res.details) {
        const details = res.details;
        data.push(["Section minimale normative", res.minimalSection || 'N/A', "mm²"]);
        data.push(["Section recommandée", res.recommendedSection, "mm²"]);
        data.push(["Courant admissible Iz'", details.izCorrected.toFixed(1), "A"]);
        data.push(["Chute de tension", details.dU.toFixed(2), "V"]);
        data.push(["Chute de tension", details.dU_percent.toFixed(2), "%"]);
        data.push(["Disjoncteur recommandé", BREAKER_RATINGS[res.recommendedSection] || 'N/A', "A"]);
    } else if (res.mode === 'distance') {
        data.push(["Section spécifiée", inputs.givenSection, "mm²"]);
        data.push(["Distance maximale admissible", res.maxDistance ? res.maxDistance.toFixed(2) : 'N/A', "m"]);
        data.push(["Courant admissible Iz'", res.izCorrected.toFixed(1), "A"]);
    } else if (res.mode === 'current') {
        data.push(["Section spécifiée", inputs.givenSection, "mm²"]);
        data.push(["Courant maximal final", res.maxCurrentFinal.toFixed(2), "A"]);
        data.push(["Limite thermique (Iz')", res.maxCurrentThermal.toFixed(2), "A"]);
        data.push(["Limite chute de tension", res.maxCurrentVD.toFixed(2), "A"]);
        data.push(["Icc admissible (1s)", res.scc_1s.toFixed(0), "A"]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + data.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `calcul_cable_${currentMode}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function exportPDF() {
    try {
        if (!window.jspdf || !window.html2canvas) {
            alert("Bibliothèques PDF non chargées. Veuillez rafraîchir la page.");
            return;
        }

        const { jsPDF } = window.jspdf;

        const inputPanel = document.getElementById('input-panel-pdf');
        const resultsPanel = document.getElementById('results-panel');
        const recoPanel = document.getElementById('recommendations-panel');

        if (!inputPanel || !resultsPanel || !recoPanel) {
            console.error("Éléments manquants pour la génération PDF");
            return;
        }

        const pdf = new jsPDF('l', 'mm', 'a1');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(28);
        pdf.text("Note de Calcul - Dimensionnement Câble Électrique", pdfWidth / 2, 30, { align: 'center' });

        let currentY = 50;

        const addImage = async (element, y, scale = 0.4) => {
            const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            let imgWidth = (pdfWidth - 2 * margin) * scale;
            let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            if (y + imgHeight > pdfHeight - margin - 20) {
                pdf.addPage();
                y = margin + 15;
            }

            pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            return y + imgHeight + 10;
        };

        pdf.setFontSize(18);
        pdf.text("Paramètres d'entrée", margin, currentY);
        currentY += 8;
        currentY = await addImage(inputPanel, currentY);

        pdf.text("Résultats de Calcul", margin, currentY);
        currentY += 8;
        currentY = await addImage(resultsPanel, currentY, 0.5);

        if (currentY > pdfHeight - 100) {
            pdf.addPage();
            currentY = margin + 15;
        }

        pdf.text("Préconisations et Alertes", margin, currentY);
        currentY += 8;
        await addImage(recoPanel, currentY, 0.4);

        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(11);
            pdf.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, pdfHeight - 10);
            pdf.text(`Page ${i}/${pageCount}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
            pdf.text("DimCable MGS-05", pdfWidth - margin, pdfHeight - 10, { align: 'right' });
        }

        pdf.save(`note_calcul_cable_${currentMode}_${new Date().toISOString().slice(0,10)}.pdf`);

    } catch (error) {
        console.error("Erreur génération PDF:", error);
        alert("Erreur lors de la génération du PDF. Vérifiez la console.");
    }
}
