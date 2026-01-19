import { CreateMLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/+esm";

// Qwen3-0.6B-Instruct 모델 설정
// - 모델 가중치: HuggingFace mlc-ai 저장소
// - WASM 라이브러리: mlc-ai GitHub 공식 바이너리
const MODEL_ID = "Qwen3-0.6B-Instruct-q4f16_1-MLC";

const appConfig = {
    model_list: [
        {
            model: "https://huggingface.co/mlc-ai/Qwen3-0.6B-Instruct-q4f16_1-MLC",
            model_id: MODEL_ID,
            model_lib: "https://raw.githubusercontent.com/AIPIELab/wasm-helper/main/Qwen3-0.6B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm",
            overrides: {
                context_window_size: 4096,
            },
        },
    ],
};

const SYSTEM_PROMPT = `You are an Antigravity Image Artist. Your role is to expand user keywords into ethereal, weightless, and surreal image prompts in English. Focus on concepts like 'floating', 'suspended', 'ethereal lighting', and 'defying gravity'. Output ONLY the Prompt and Negative Prompt.`;


// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const userInput = document.getElementById('user-input');
const outputContainer = document.getElementById('output-container');
const outputText = document.getElementById('output-text');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const progressText = document.getElementById('progress-text');

let engine = null;
let isModelLoaded = false;

// Particle Effect
function createParticles(x, y) {
    const particleCount = 20;
    const container = document.getElementById('particles');

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random angle and distance
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        particle.style.setProperty('--tw-translate-x', `${tx}px`);
        particle.style.setProperty('--tw-translate-y', `${ty}px`);

        container.appendChild(particle);

        // Cleanup
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }
}

// Init Model
async function initModel() {
    if (isModelLoaded) return;

    progressContainer.classList.remove('hidden');
    progressText.innerText = "Initializing Engine...";

    const initProgressCallback = (report) => {
        console.log(report);
        const progress = report.progress; // 0 to 1
        const pct = Math.round(progress * 100);
        progressBar.style.width = `${pct}%`;
        progressPercent.innerText = `${pct}%`;
        progressText.innerText = report.text;
    };

    try {
        engine = await CreateMLCEngine(
            MODEL_ID,
            {
                appConfig: appConfig,
                initProgressCallback: initProgressCallback
            }
        );
        isModelLoaded = true;
        progressContainer.classList.add('hidden');
        console.log("Model Loaded!");
    } catch (error) {
        console.error("Model Load Failed:", error);
        progressText.innerText = "Error Loading Model";
        progressText.classList.add('text-red-400');
    }
}

// Generate Handler
async function handleGenerate(e) {
    // Particle effect at click position
    const rect = generateBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    createParticles(centerX, centerY);

    const prompt = userInput.value.trim();
    if (!prompt) return;

    // Load model if first time
    if (!isModelLoaded) {
        generateBtn.disabled = true;
        await initModel();
        generateBtn.disabled = false;
    }

    // Prepare UI for generation
    generateBtn.disabled = true;
    outputText.style.opacity = '0.5';
    outputText.innerText = "Dreaming...";

    try {
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Create an antigravity prompt for: ${prompt}` }
        ];

        const reply = await engine.chat.completions.create({
            messages,
        });

        const result = reply.choices[0].message.content;

        // Display Result
        outputText.innerText = result;
        outputText.style.opacity = '1';

    } catch (error) {
        console.error("Generation Failed:", error);
        outputText.innerText = "Error: Could not generate prompt.";
        outputText.style.opacity = '1';
    } finally {
        generateBtn.disabled = false;
    }
}

// Event Listeners
generateBtn.addEventListener('click', handleGenerate);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGenerate(e);
});
