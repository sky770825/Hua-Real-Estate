// Toast Notification
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Copy to Clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`✅ 已複製: ${text}`);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`✅ 已複製: ${text}`);
    } catch (err) {
      showToast('❌ 複製失敗，請手動複製');
    }
    document.body.removeChild(textArea);
  }
}

// Copy All Environment Variables
function copyAllEnvVars() {
  const envTemplate = `# Supabase (write access)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx
SUPABASE_ACCESS_TOKEN=xxxx

# Dual env for db push (Supabase CLI)
SUPABASE_PROJECT_REF_STAGING=xxxx
SUPABASE_DB_PASSWORD_STAGING=xxxx
SUPABASE_PROJECT_REF_PROD=xxxx
SUPABASE_DB_PASSWORD_PROD=xxxx

# OpenAI Embedding (1536 dims)
OPENAI_API_KEY=xxxx
OPENAI_EMBED_MODEL=text-embedding-3-small

# GitHub
GITHUB_TOKEN=xxxx
GITHUB_USERNAME=xxxx
GITHUB_REPO_URL=https://github.com/username/repo.git

# n8n
N8N_API_KEY=xxxx
N8N_BASE_URL=https://app.n8n.io
N8N_WEBHOOK_URL=https://app.n8n.io/webhook/xxxx
N8N_WORKFLOW_ID=123`;

  copyToClipboard(envTemplate);
  showToast('✅ 已複製所有環境變數範本');
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Copy buttons
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const varName = e.currentTarget.getAttribute('data-copy');
      if (varName) {
        copyToClipboard(varName);
      }
    });
  });

  // Copy all env vars button
  const copyAllBtn = document.getElementById('copy-all-env');
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', copyAllEnvVars);
  }

  // Add click animation to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on a button or link
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
        return;
      }
      
      // Find copy button in this card
      const copyBtn = card.querySelector('.copy-btn');
      if (copyBtn) {
        const varName = copyBtn.getAttribute('data-copy');
        if (varName) {
          copyToClipboard(varName);
        }
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search (if we add search later)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      // Future: focus search input
    }
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
