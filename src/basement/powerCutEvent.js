export function createPowerCutEvent(houseLights, onFlashlightEquip) {
  let triggered = false;

  function trigger() {
    if (triggered) return false;
    triggered = true;

    let flickers = 0;
    const interval = setInterval(() => {
      const targetIntensity = (flickers % 2 === 0) ? 0 : 0.8;
      houseLights.forEach(l => {
          if (l.isLight) l.intensity = targetIntensity;
      });
      
      flickers++;
      if (flickers > 5) {
        clearInterval(interval);
        houseLights.forEach(l => {
            if (l.isLight) l.intensity = 0;
        });
        
        // Rumble feedback
        if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('power-cut'));
        }
        
        setTimeout(onFlashlightEquip, 1800);
      }
    }, 120);
    
    return true;
  }

  return { trigger };
}
