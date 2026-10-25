(function() {
    console.log("⚙️ HACK ENGINE LOADED (Infinite Hold Mode)");

    let hackSettings = {
        isRunning: false,
        price: null,
        delayTime: 5,
        hackActive: false,
        timeoutId: null
    };

    let currentVirtualPrice = null; 

    const originalDecode = TextDecoder.prototype.decode;

    TextDecoder.prototype.decode = function(...args) {
        let text = originalDecode.apply(this, args);

        if (typeof text === "string" && text.startsWith('[["') && text.split(",").length === 4) {
            
            // If hack is disabled, pass real data
            if (!hackSettings.isRunning || !hackSettings.hackActive) {
                currentVirtualPrice = null; 
                return text; 
            }

            let parts = text.split(",");
            
            const realPrice = parseFloat(parts[2]);
            const targetPrice = parseFloat(hackSettings.price);
            const decimalPlaces = (hackSettings.price.toString().split('.')[1] || '').length || 2;

            // Initialize the virtual price on the first hacked tick
            if (currentVirtualPrice === null) {
                currentVirtualPrice = realPrice;
                console.log(`🚀 INITIALIZING GLIDE FROM REAL PRICE: ${realPrice}`);
            }

            let finalPrice;
            const gap = targetPrice - currentVirtualPrice;

            // 🚨 GLIDE vs FLUCTUATE
            // If the gap is larger than 0.1% of the target, we are still gliding
            if (Math.abs(gap) > (targetPrice * 0.001)) {
                currentVirtualPrice += gap * 0.05; // Glide 5% closer each tick
                finalPrice = currentVirtualPrice;
            } else {
                // We are close enough! Now apply the natural fluctuation around the target
                const volatility = 0.0005; // 0.05% fluctuation
                const randomOffset = (Math.random() - 0.5) * (targetPrice * volatility);
                finalPrice = targetPrice + randomOffset;
                
                // Keep currentVirtualPrice anchored to the target to prevent drift
                currentVirtualPrice = targetPrice; 
            }

            const newPriceStr = finalPrice.toFixed(decimalPlaces);
            
            // Replace the price in the split array
            parts[2] = " " + newPriceStr; 
            const hackedText = parts.join(",");

            // Update the UI counter
            window.postMessage({ type: "INCREMENT_INTERCEPT" }, "*");

            return hackedText;
        }
        return text;
    };

    window.addEventListener("message", (event) => {
        if (event.source !== window) return;
        
        if (event.data && event.data.type === "START_HACK") {
            console.log(`⏳ START_HACK RECEIVED! Waiting ${event.data.time} seconds before hacking...`);
            
            hackSettings.price = parseFloat(event.data.price).toFixed(2);
            hackSettings.delayTime = parseInt(event.data.time);
            hackSettings.isRunning = true;
            hackSettings.hackActive = false; // Wait for the delay
            currentVirtualPrice = null; 

            if (hackSettings.timeoutId) clearTimeout(hackSettings.timeoutId);

            // 🚨 THE FIX: Use setTimeout instead of setInterval
            hackSettings.timeoutId = setTimeout(() => {
                console.log(`🔥 DELAY OVER! Locking onto target: ${hackSettings.price}`);
                hackSettings.hackActive = true; // Stay active forever until STOP
                currentVirtualPrice = null; // Re-initialize glide from the current real price
            }, hackSettings.delayTime * 1000);
        }

        if (event.data && event.data.type === "STOP_HACK") {
            console.log("🛑 STOP_HACK RECEIVED! Returning to real data.");
            hackSettings.isRunning = false;
            hackSettings.hackActive = false;
            currentVirtualPrice = null; 
            if (hackSettings.timeoutId) clearTimeout(hackSettings.timeoutId);
        }
    });
})();