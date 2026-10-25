javascript:(async function() {
    // 1. Prevent double injection
    if (document.getElementById('license-host')) return;

    // 2. Setup Host & Shadow DOM
    const host = document.createElement('div');
    host.id = 'license-host';
    host.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999999; width: 380px; font-family: monospace;';
    const shadow = host.attachShadow({ mode: 'open' });

    // 3. The CSS
    const style = document.createElement('style');
    style.textContent = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        @keyframes start-glow { 0% { box-shadow: 0 0 5px rgba(0, 240, 255, 0.4); } 50% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.8), inset 0 0 10px rgba(0, 240, 255, 0.3); } 100% { box-shadow: 0 0 5px rgba(0, 240, 255, 0.4); } }
        
        .panel { background: rgba(13, 20, 34, 0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 16px; color: #fff; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 30px rgba(0,240,255,0.1); position: relative; display: flex; flex-direction: column; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid rgba(0, 240, 255, 0.15); cursor: grab; background: rgba(0,0,0,0.2); }
        .header:active { cursor: grabbing; }
        .title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #00F0FF; letter-spacing: 1px; text-shadow: 0 0 8px rgba(0,240,255,0.5); }
        .btn-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: #162035; border: 1px solid #334155; border-radius: 6px; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
        .btn-icon:hover { color: #FF2A55; border-color: #FF2A55; }
        
        .body { padding: 24px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .logo { width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.6)); margin-bottom: 15px; }
        .subtitle { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
        
        .input-wrapper { width: 100%; position: relative; margin-bottom: 15px; }
        .input-wrapper input { width: 100%; background: #070b12; border: 1px solid rgba(0, 240, 255, 0.3); padding: 14px; color: #fff; font-family: monospace; font-size: 16px; font-weight: bold; border-radius: 8px; outline: none; text-align: center; letter-spacing: 3px; transition: all 0.3s; }
        .input-wrapper input:focus { border-color: #00F0FF; box-shadow: 0 0 15px rgba(0,240,255,0.2); }
        
        .activate-btn { width: 100%; padding: 14px; border-radius: 8px; font-weight: bold; font-size: 13px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(0, 240, 255, 0.4); background: linear-gradient(to right, #06b6d4, #2563eb); color: #fff; transition: all 0.3s; letter-spacing: 1px; }
        .activate-btn:hover { filter: brightness(1.2); animation: start-glow 1.5s infinite; }
        .activate-btn:disabled { opacity: 0.7; cursor: wait; animation: none; }
        .activate-btn.error { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; border-color: #FF2A55; background: rgba(22, 12, 20, 0.8); color: #fda4af; }
        
        .status { margin-top: 15px; font-size: 11px; font-weight: bold; min-height: 16px; letter-spacing: 1px; text-transform: uppercase; }
        .status.error { color: #FF2A55; }
        .status.success { color: #10b981; }
    `;
    shadow.appendChild(style);

    // 4. The HTML
    const container = document.createElement('div');
    container.className = 'panel';
    container.innerHTML = `
        <div class="header" id="drag-header">
            <div class="title">System Locked</div>
            <div class="btn-icon" id="close-btn">✕</div>
        </div>
        <div class="body">
            <img class="logo" src="https://i.ibb.co/XZTdfw2x/logo.png" alt="Logo" />
            <div class="subtitle">Enter License Key to Activate</div>
            <div class="input-wrapper">
                <input type="text" id="key-input" placeholder="XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" />
            </div>
            <button class="activate-btn" id="activate-btn">Activate Terminal</button>
            <div class="status" id="status-text"></div>
        </div>
    `;
    shadow.appendChild(container);
    document.body.appendChild(host);

    // 5. UI Logic (Dragging & Closing)
    const header = container.querySelector('#drag-header');
    const closeBtn = container.querySelector('#close-btn');
    const input = container.querySelector('#key-input');
    const btn = container.querySelector('#activate-btn');
    const statusText = container.querySelector('#status-text');

    let isDragging = false, offsetX, offsetY;
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('#close-btn')) return;
        isDragging = true;
        // Using getBoundingClientRect because of transform translate
        const rect = host.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        host.style.transform = 'none'; // remove transform for easier dragging
        host.style.left = rect.left + 'px';
        host.style.top = rect.top + 'px';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        host.style.left = (e.clientX - offsetX) + 'px';
        host.style.top = (e.clientY - offsetY) + 'px';
    });
    document.addEventListener('mouseup', () => isDragging = false);
    closeBtn.addEventListener('click', () => host.remove());

    // 6. Activation Logic
    btn.addEventListener('click', async () => {
        const key = input.value.trim();
        if (!key) {
            statusText.innerText = "Please enter a key.";
            statusText.className = "status error";
            btn.classList.add('error');
            setTimeout(() => btn.classList.remove('error'), 400);
            return;
        }

        // Loading State
        statusText.innerText = "Verifying...";
        statusText.className = "status";
        statusText.style.color = "#94a3b8";
        btn.innerText = "Verifying...";
        btn.disabled = true;
        input.disabled = true;

        try {
            // 🚨 REPLACE THIS WITH YOUR ACTUAL NEXT.JS URL 🚨
            const response = await fetch("https://your-nextjs-app.vercel.app/api/get-hack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ license: key })
            });

            if (!response.ok) throw new Error("Invalid or expired license key.");
            
            const data = await response.json();
            
            // Success State
            statusText.innerText = "✅ Access Granted. Loading...";
            statusText.className = "status success";
            btn.innerText = "Success";
            btn.style.background = "#10b981";
            btn.style.borderColor = "#10b981";

            setTimeout(() => {
                // 1. Inject the payload from the server
                const script = document.createElement("script");
                script.textContent = data.payload;
                document.body.appendChild(script);
                script.remove();
                
                // 2. Remove the license UI
                host.remove();
            }, 1000);

        } catch (error) {
            // Error State
            statusText.innerText = "❌ " + error.message;
            statusText.className = "status error";
            btn.innerText = "Activate Terminal";
            btn.disabled = false;
            input.disabled = false;
            btn.classList.add('error');
            setTimeout(() => btn.classList.remove('error'), 400);
        }
    });
})();