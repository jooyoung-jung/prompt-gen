import { CreateMLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/+esm";

const MODEL_ID = "Qwen3-0.6B-q4f16_1-MLC";
const SYSTEM_PROMPT = `You are a professional AI image prompt engineer. Expand the user keyword into a detailed, high-quality image prompt in English. Output ONLY the Prompt and Negative Prompt.`;

// DOM Elements
const generateBtn = document.getElementById('generate-btn');
const btnIcon = document.getElementById('btn-icon');
const btnText = document.getElementById('btn-text');
const userInput = document.getElementById('user-input');
const outputContainer = document.getElementById('output-container');
const outputText = document.getElementById('output-text');
const resetBtn = document.getElementById('reset-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const innerLoadingBar = document.getElementById('inner-loading-bar');
const loadingText = document.getElementById('loading-text');

let engine = null;
let isModelLoaded = false;

// Handle Input validation
function updateBtnState() {
    const val = userInput.value.trim();
    if (val) {
        generateBtn.disabled = false;
        btnIcon.innerText = "✨";
        btnText.innerText = "프롬프트 생성";
    } else {
        generateBtn.disabled = true;
        btnIcon.innerText = "⚠️";
        btnText.innerText = "주제를 입력해주세요";
    }
}

// Remove <think> tags
function filterResult(text) {
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// Init WebLLM
async function initModel() {
    if (isModelLoaded) return;

    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');

    const initProgressCallback = (report) => {
        const pct = Math.round(report.progress * 100);
        innerLoadingBar.style.width = `${pct}%`;
        loadingText.innerText = `모델 로딩 중 (${pct}%)`;
    };

    try {
        engine = await CreateMLCEngine(MODEL_ID, { initProgressCallback });
        isModelLoaded = true;
        loadingOverlay.classList.add('hidden');
        loadingOverlay.classList.remove('flex');
    } catch (e) {
        console.error(e);
        loadingText.innerText = "로딩 실패";
    }
}

// Generate
async function handleGenerate() {
    const prompt = userInput.value.trim();
    if (!prompt) return;

    if (!isModelLoaded) {
        await initModel();
        if (!isModelLoaded) return;
    }

    generateBtn.disabled = true;
    btnText.innerText = "생성 중...";
    outputContainer.classList.add('hidden');

    try {
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ];
        const reply = await engine.chat.completions.create({ messages });
        const result = filterResult(reply.choices[0].message.content);

        outputText.innerText = result;
        outputContainer.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        outputText.innerText = "오류가 발생했습니다.";
    } finally {
        generateBtn.disabled = false;
        updateBtnState();
    }
}

// Listeners
userInput.addEventListener('input', updateBtnState);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGenerate();
});
generateBtn.addEventListener('click', handleGenerate);
resetBtn.addEventListener('click', () => {
    userInput.value = "";
    outputContainer.classList.add('hidden');
    updateBtnState();
});

document.querySelectorAll('.engine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.engine-btn').forEach(b => {
            b.classList.remove('active', 'bg-brand-accent');
            b.classList.add('bg-brand-card', 'border-brand-border', 'text-brand-text-muted');
        });
        btn.classList.add('active', 'bg-brand-accent');
        btn.classList.remove('bg-brand-card', 'border-brand-border', 'text-brand-text-muted');
    });
});

document.getElementById('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(outputText.innerText);
    alert('복사되었습니다!');
});
