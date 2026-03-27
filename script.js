// Mock Data
const user = {
    name: "Juan Pérez",
    location: "Popayán, Cauca",
    phone: "3123456789",
    plan: "Gratis",
    queriesRemaining: 3,
    expenses: 785000
};

const agronomist = {
    name: "Ing. Carlos Ruiz",
    specialty: "Especialista en café y cacao",
    phone: "3109876543"
};

const crops = [
    { id: 1, name: "Café", area: 2.5, plantedDate: "2026-02-10", age: 45, status: "good", icon: "bx-coffee-bean" },
    { id: 2, name: "Maíz", area: 1.2, plantedDate: "2026-03-05", age: 20, status: "warning", icon: "bx-leaf" },
    { id: 3, name: "Cacao", area: 0.8, plantedDate: "2026-01-25", age: 60, status: "good", icon: "bx-lemon" }
];

const queries = [
    { id: 1, title: "Hojas amarillas en café", date: "Hace 2 días", icon: "bx-list-ul" },
    { id: 2, title: "Plaga en maíz", date: "Hace 1 semana", icon: "bx-bug" }
];

// App State
let currentScreen = 'screen-login';
let currentBase64Image = null;
let currentMimeType = null;
let isAuthenticated = false; // Authentication state

// Query Control State (in-memory, volatile)
let dailyQueryCount = 0;
const MAX_DAILY_QUERIES = 10;
let queryCounterResetTime = Date.now();

// DOM Elements
const screens = document.querySelectorAll('.screen');
const navBar = document.getElementById('bottom-navigation');
const navItems = document.querySelectorAll('.nav-item');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Ensure nav is hidden on initial load
    if (navBar) navBar.classList.add('hidden');

    initAuth();
    initNavigation();
    renderHomeData();
    renderFarmData();
    initInteractions();
    initImageUpload();
    updateQueryLimitUI();
});

// Query Limit Control Functions
function checkAndResetQueryCounter() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - queryCounterResetTime >= twentyFourHours) {
        dailyQueryCount = 0;
        queryCounterResetTime = now;
    }
}

function canMakeQuery() {
    checkAndResetQueryCounter();
    return dailyQueryCount < MAX_DAILY_QUERIES;
}

function incrementQueryCount() {
    checkAndResetQueryCounter();
    if (dailyQueryCount < MAX_DAILY_QUERIES) {
        dailyQueryCount++;
    }
    updateQueryLimitUI();
}

function updateQueryLimitUI() {
    checkAndResetQueryCounter();
    const remaining = MAX_DAILY_QUERIES - dailyQueryCount;
    const queriesRemainingEl = document.getElementById('queries-remaining-display');
    const submitBtn = document.getElementById('btn-submit-consult');

    if (queriesRemainingEl) {
        queriesRemainingEl.textContent = `Consultas restantes hoy: ${remaining}/${MAX_DAILY_QUERIES}`;
    }

    if (submitBtn) {
        if (remaining === 0) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.innerHTML = "<i class='bx bx-block'></i> Límite diario alcanzado";
        } else {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    }
}

// Navigation Engine
function navigateTo(screenId) {
    // Hide all screens
    screens.forEach(s => s.classList.remove('active'));

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    // Manage bottom nav visibility - only show if authenticated and not on login/diagnosis screens
    if (!isAuthenticated || screenId === 'screen-login' || screenId === 'screen-diagnosis') {
        navBar.classList.add('hidden');
        navBar.style.display = 'none'; // Force hide
    } else {
        navBar.classList.remove('hidden');
        navBar.style.display = 'flex'; // Force show
    }

    // Update active nav item
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.target === screenId) {
            item.classList.add('active');
        }
    });

    currentScreen = screenId;

    // Reset scroll positions
    document.querySelectorAll('.screen-content').forEach(el => el.scrollTop = 0);
}

// Authentication Listeners
function initAuth() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        isAuthenticated = true; // Set authentication state
        navigateTo('screen-home');
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        isAuthenticated = false; // Reset authentication state
        navigateTo('screen-login');
    });
}

// Navigation Listeners
function initNavigation() {
    // Protected screens that require authentication
    const protectedScreens = ['screen-home', 'screen-farm', 'screen-consult', 'screen-plans', 'screen-profile'];

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.target;

            // Block navigation to protected screens if not authenticated
            if (protectedScreens.includes(target) && !isAuthenticated) {
                return;
            }

            navigateTo(target);
        });
    });

    // Custom Triggers
    document.getElementById('nav-to-profile-btn').addEventListener('click', () => {
        if (isAuthenticated) navigateTo('screen-profile');
    });

    document.getElementById('link-all-crops').addEventListener('click', (e) => {
        e.preventDefault();
        if (isAuthenticated) navigateTo('screen-farm');
    });

    // Action buttons on Home
    document.getElementById('btn-camera-home').addEventListener('click', () => {
        if (isAuthenticated) navigateTo('screen-consult');
    });
    document.getElementById('btn-upload-home').addEventListener('click', () => {
        if (isAuthenticated) navigateTo('screen-consult');
    });
    document.getElementById('btn-write-home').addEventListener('click', () => {
        if (isAuthenticated) navigateTo('screen-consult');
    });

    // Diagnosis Navigation
    document.getElementById('btn-back-diagnosis').addEventListener('click', () => {
        if (isAuthenticated) navigateTo('screen-home');
    });
    document.getElementById('btn-new-query').addEventListener('click', () => {
        if (isAuthenticated) {
            resetConsultForm();
            navigateTo('screen-consult');
        }
    });
}

// Image Upload functionality
function checkConsultFormState() {
    const btn = document.getElementById('btn-submit-consult');
    if (!btn) return;

    // Verificar que haya una imagen
    const hasImage = currentBase64Image !== null && currentBase64Image.trim() !== '';

    // Verificar límite de consultas
    const canQuery = canMakeQuery();

    // Habilitar/deshabilitar según si hay imagen y límite no alcanzado
    btn.disabled = !hasImage || !canQuery;

    // Cambiar estilo visual
    if (hasImage && canQuery) {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    } else {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }
}

function initImageUpload() {
    const fileInput = document.getElementById('crop-image');
    const uploadArea = document.getElementById('upload-area');
    const removeImageBtn = document.getElementById('btn-remove-image');

    if (!fileInput) return;

    // Trigger camera/file input when clicking on upload area
    uploadArea.addEventListener('click', function (e) {
        // Prevent triggering when clicking on the remove button or preview
        if (e.target.id === 'btn-remove-image' || e.target.closest('#btn-remove-image')) {
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            currentMimeType = file.type;
            const reader = new FileReader();
            reader.onload = function (evt) {
                // Remove data URL prefix
                currentBase64Image = evt.target.result.split(',')[1];

                const previewImg = document.getElementById('image-preview');
                previewImg.src = evt.target.result;
                previewImg.style.display = 'block';

                // Hide upload icon and text
                document.getElementById('upload-icon').style.display = 'none';
                document.getElementById('upload-text').style.display = 'none';
                uploadArea.style.border = 'none';

                // Show remove/change photo button
                if (removeImageBtn) {
                    removeImageBtn.style.display = 'flex';
                }

                checkConsultFormState();
            };
            reader.readAsDataURL(file);
        } else {
            currentBase64Image = null;
            currentMimeType = null;
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('image-preview').src = '';
            document.getElementById('upload-icon').style.display = 'block';
            document.getElementById('upload-text').style.display = 'block';
            uploadArea.style.border = '2px dashed #9AE6B4';
            if (removeImageBtn) {
                removeImageBtn.style.display = 'none';
            }
            checkConsultFormState();
        }
    });

    // Remove/Change image button handler
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Clear file input
            fileInput.value = '';
            // Reset state
            currentBase64Image = null;
            currentMimeType = null;
            // Hide preview and remove button
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('image-preview').src = '';
            document.getElementById('upload-icon').style.display = 'block';
            document.getElementById('upload-text').style.display = 'block';
            uploadArea.style.border = '2px dashed #9AE6B4';
            removeImageBtn.style.display = 'none';
            checkConsultFormState();
        });
    }

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
}

function resetConsultForm() {
    document.getElementById('consult-form').reset();
    currentBase64Image = null;
    currentMimeType = null;

    // Clear image preview
    const previewImg = document.getElementById('image-preview');
    previewImg.style.display = 'none';
    previewImg.src = '';

    // Reset upload area to initial state
    const uploadArea = document.getElementById('upload-area');
    uploadArea.style.border = '2px dashed #9AE6B4';
    uploadArea.classList.remove('dragover');

    // Reset upload icon and text
    const uploadIcon = document.getElementById('upload-icon');
    const uploadText = document.getElementById('upload-text');
    if (uploadIcon) uploadIcon.style.display = 'block';
    if (uploadText) uploadText.style.display = 'block';

    // Clear file input value
    const fileInput = document.getElementById('crop-image');
    if (fileInput) fileInput.value = '';

    // Hide remove/change photo button
    const removeImageBtn = document.getElementById('btn-remove-image');
    if (removeImageBtn) removeImageBtn.style.display = 'none';

    checkConsultFormState();
}

// Dynamic Data Rendering
function renderHomeData() {
    document.getElementById('user-name-display').textContent = user.name.split(' ')[0];

    const homeCropsContainer = document.getElementById('home-crops-container');
    homeCropsContainer.innerHTML = '';
    crops.forEach(crop => {
        homeCropsContainer.innerHTML += `
            <div class="crop-card-mini">
                <div class="crop-icon"><i class='bx ${crop.icon}'></i></div>
                <h4>${crop.name}</h4>
                <p>${crop.area} Hectáreas</p>
            </div>
        `;
    });

    const queriesContainer = document.getElementById('home-queries-container');
    queriesContainer.innerHTML = '';
    queries.forEach(query => {
        queriesContainer.innerHTML += `
            <div class="query-item">
                <div class="icon"><i class='bx ${query.icon}'></i></div>
                <div class="query-info">
                    <h5>${query.title}</h5>
                    <p>${query.date}</p>
                </div>
                <i class='bx bx-chevron-right' style="color: var(--text-muted); font-size: 20px;"></i>
            </div>
        `;
    });
}

function renderFarmData() {
    const farmCropsContainer = document.getElementById('farm-crops-container');
    farmCropsContainer.innerHTML = '';

    crops.forEach(crop => {
        const statusClass = crop.status === 'good' ? 'good' : 'warning';
        const statusText = crop.status === 'good' ? 'Saludable' : 'Alerta';

        farmCropsContainer.innerHTML += `
            <div class="crop-full-card">
                <div class="crop-full-header">
                    <div class="crop-title">
                        <div class="icon-bg"><i class='bx ${crop.icon}'></i></div>
                        <div>
                            <h4>${crop.name}</h4>
                            <p>${crop.area} Hectáreas</p>
                        </div>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="crop-details-grid">
                    <div class="detail-item">
                        <p>Fecha Siembra</p>
                        <h6>${formatDate(crop.plantedDate)}</h6>
                    </div>
                    <div class="detail-item">
                        <p>Edad</p>
                        <h6>${crop.age} días</h6>
                    </div>
                </div>
                <div class="crop-actions">
                    <button class="btn-text">Ver detalle</button>
                    <button class="btn-text">Editar</button>
                    <button class="btn-text-danger"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `;
    });
}

// Interactions and Modals
function initInteractions() {
    // Textarea input event for dynamic button
    document.getElementById('consult-desc').addEventListener('input', checkConsultFormState);

    // Consult Form Submit (Gemini API Integration)
    const consultForm = document.getElementById('consult-form');
    const submitBtn = document.getElementById('btn-submit-consult');

    consultForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Bloqueo Inmediato
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Analizando...";
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'not-allowed';

        // Validación de Envío: Imagen Obligatoria real
        if (!currentBase64Image || currentBase64Image.trim() === '') {
            alert("¡Espera! Para poder diagnosticar, por favor toma o sube una foto clara de la planta u hongo.");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.style.cursor = 'pointer';
            return;
        }

        // Verificar límite de consultas
        if (!canMakeQuery()) {
            alert("Has alcanzado el límite de 10 consultas diarias. Por favor, vuelve mañana para más diagnósticos.");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = true;
            submitBtn.style.cursor = 'not-allowed';
            updateQueryLimitUI();
            return;
        }

        // Descripción Opcional Segura
        const descInput = document.getElementById('consult-desc');
        const desc = descInput ? descInput.value.trim() : '';

        let promptUsuario;
        if (desc) {
            promptUsuario = `El agricultor reporta el siguiente detalle: "${desc}". Por favor, analiza la imagen con este contexto, dime qué problema u hongo observas y dame el tratamiento adecuado.`;
        } else {
            promptUsuario = "Analiza detalladamente esta imagen de mi cultivo, dime qué problema u hongo observas y dame el tratamiento adecuado.";
        }

        try {
            const jsonResult = await window.consultarExpertoIA(promptUsuario, currentBase64Image, currentMimeType);

            // Incrementar contador de consultas solo en caso de éxito
            incrementQueryCount();

            renderFromJSON(jsonResult);

            // Set the uploaded image to the diagnosis view
            document.getElementById('diag-image').src = `data:${currentMimeType};base64,${currentBase64Image}`;
            document.getElementById('diag-image').style.display = 'block';

            // Limpiar formulario después de diagnóstico exitoso
            resetConsultForm();

            navigateTo('screen-diagnosis');
        } catch (error) {
            console.error("Error capturado: ", error);
            alert(error.message);
        } finally {
            // Restore button state (siempre se restaura, excepto si se alcanzó el límite)
            if (canMakeQuery()) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.style.cursor = 'pointer';
            } else {
                updateQueryLimitUI();
            }
        }
    });

    // Add Crop Modal Togglers
    const modal = document.getElementById('add-crop-modal');
    document.getElementById('btn-open-add-crop').addEventListener('click', () => {
        modal.classList.add('active');
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        modal.classList.remove('active');
    });

    const addCropForm = document.getElementById('add-crop-form');
    addCropForm.addEventListener('submit', (e) => {
        e.preventDefault();
        modal.classList.remove('active');
        addCropForm.reset();
        alert("¡Cultivo guardado de forma simulada!");
    });

    // Subscribe Buttons Feedback
    const subscribeBtns = document.querySelectorAll('.subscribe-btn');
    subscribeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const plan = e.target.dataset.plan;
            alert(`Simulando proceso de pago para el Plan ${plan}...\n¡Aprobado exitosamente!`);
        });
    });
}

function renderFromJSON(jsonObj) {
    document.getElementById('diag-title').textContent = "Asesoría Experta IA";
    document.getElementById('diag-confidence').textContent = `Urgencia: ${jsonObj.urgencia}`;
    document.getElementById('diag-desc').textContent = sanitizeText(jsonObj.diagnostico);

    // Steps
    const stepsUl = document.getElementById('diag-steps');
    stepsUl.innerHTML = '';
    if (jsonObj.tratamiento && Array.isArray(jsonObj.tratamiento)) {
        jsonObj.tratamiento.forEach((r, idx) => {
            const sanitizedStep = sanitizeText(r);
            stepsUl.innerHTML += `<li><span>${idx + 1}</span> ${sanitizedStep}</li>`;
        });
    }

    // Product
    const prodContainer = document.getElementById('diag-product-container');
    const prod = sanitizeText(jsonObj.producto) || "No aplica";
    if (prod.toLowerCase().includes('no aplica') || prod.length < 5) {
        prodContainer.style.display = 'none';
    } else {
        prodContainer.style.display = 'flex';
        document.getElementById('diag-product-name').textContent = "Insumo Sugerido";
        document.getElementById('diag-product-dose').textContent = prod;
    }

    // Tip
    const consejo = jsonObj.consejo ? sanitizeText(jsonObj.consejo) : "Recomendado por tu Agrónomo Virtual AI.";
    document.getElementById('diag-tip').textContent = `"${consejo}"`;
}

/**
 * Sanitizes text by removing markdown formatting and unwanted characters
 * @param {string} text - Text to sanitize
 * @returns {string} - Cleaned text
 */
function sanitizeText(text) {
    if (!text) return '';

    let sanitized = text;

    // Remove asterisks (single and double for bold/italic)
    sanitized = sanitized.replace(/\*\*/g, '');
    sanitized = sanitized.replace(/\*/g, '');

    // Remove underscore formatting
    sanitized = sanitized.replace(/__/g, '');
    sanitized = sanitized.replace(/_/g, '');

    // Remove markdown headers
    sanitized = sanitized.replace(/^#+\s*/gm, '');

    // Remove markdown list markers ( -, *, + at start of line)
    sanitized = sanitized.replace(/^[\-\*\+]\s*/gm, '');

    // Remove numbered list markers (1. 2. etc.) - we add our own numbering
    sanitized = sanitized.replace(/^\d+\.\s*/gm, '');

    // Remove markdown code blocks
    sanitized = sanitized.replace(/```/g, '');
    sanitized = sanitized.replace(/`/g, '');

    // Remove extra whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
}

// Helper formatting date (YYYY-MM-DD to DD/MM/YYYY)
function formatDate(dateStr) {
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
