const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const names = [];
let isSpinning = false;
let stopSpin = false; // Flag to stop spinning
let totalSpins = 0;

// Secret winners and their spin indices
let secretWinners = []; // Array of { name: 'WinnerName', spin: number }
let normalWinnerSequence = []; // Backup sequence for non-secret spins

// Sound files
const spinSound = new Audio('sounds/spin.wav');
const winSound = new Audio('sounds/winner.mp3');

function disableButtons() {
    const buttons = document.querySelectorAll('button, #nameInput');
    buttons.forEach(button => (button.disabled = true));
}

function enableButtons() {
    const buttons = document.querySelectorAll('button, #nameInput');
    buttons.forEach(button => (button.disabled = false));
}

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const numSlices = names.length;
    if (numSlices === 0) return;
    const angleStep = (2 * Math.PI) / numSlices;

    names.forEach((name, index) => {
        const startAngle = angleStep * index;
        const endAngle = startAngle + angleStep;
        const colors = ['#ff7e5f', '#feb47b', '#86e3ce', '#d0e6a5', '#f6cd61', '#fe8a71'];
        const color = colors[index % colors.length];

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(name, canvas.width / 2 - 20, 5);
        ctx.restore();
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function playSpinSoundBriefly() {
    spinSound.currentTime = 0; // Reset to start
    spinSound.play();
    setTimeout(() => spinSound.pause(), 1000); // Play sound briefly (1 second)
}

function spinWheel() {
    if (names.length < 2 || isSpinning) return;

    isSpinning = true;
    stopSpin = false; // Reset the stop flag
    disableButtons(); // Disable all buttons during the spin

    playSpinSoundBriefly(); // Play spin sound briefly

    let targetName;

    // Check if the current spin has a predefined secret winner
    const secretWinner = secretWinners.find(winner => winner.spin === totalSpins + 1);
    if (secretWinner) {
        targetName = secretWinner.name;
    } else {
        // Filter out secret winners from non-designated spins
        const availableNames = names.filter(
            name => !secretWinners.some(winner => winner.name === name)
        );

        // If normal sequence is empty, shuffle available names
        if (normalWinnerSequence.length === 0) {
            normalWinnerSequence = shuffleArray([...availableNames]);
        }

        targetName = normalWinnerSequence.shift();
    }

    if (targetName) {
        spinToSpecificName(targetName);
    }

    totalSpins++;
}

function spinToSpecificName(targetName) {
    const targetIndex = names.indexOf(targetName);
    if (targetIndex === -1) return;

    const numSlices = names.length;
    const angleStep = 360 / numSlices;
    const targetRotation = 360 - (angleStep * targetIndex) - angleStep / 2;

    spinToSpecificRotation(targetRotation, () => {
        winSound.play(); // Play winning sound
        showWinner(targetName);

        // Remove the winner from the wheel
        const winnerIndex = names.indexOf(targetName);
        if (winnerIndex !== -1) {
            names.splice(winnerIndex, 1);
        }

        drawWheel(); // Redraw the wheel to reflect the updated names
    });
}

function spinToSpecificRotation(targetRotation, onComplete) {
    let currentRotation = 0;
    const spinAmount = 1080 + targetRotation;
    const spinDuration = 4000 + Math.random() * 2000;
    const startTime = performance.now();

    function animate(time) {
        if (stopSpin) {
            resetAfterSpin(); // Stop the spinning if stopSpin is true
            return;
        }

        const elapsed = time - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentRotation = spinAmount * easeOut;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawWheel();
        ctx.restore();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            resetAfterSpin();
            if (onComplete) onComplete(); // Execute the callback when the spin finishes
        }
    }

    requestAnimationFrame(animate);
}

function stopWheel() {
    stopSpin = true; // Set the flag to stop spinning
    spinSound.pause(); // Ensure the spinning sound stops immediately
    const winnerModal = document.getElementById('winnerModal');
    const overlay = document.getElementById('overlay');

    // Hide the winner modal immediately
    winnerModal.style.display = 'none';
    overlay.style.display = 'none';

    // Reset spinning state
    resetAfterSpin();
}

function resetAfterSpin() {
    isSpinning = false;
    enableButtons(); // Re-enable all buttons after the spin
}

function addName() {
    const nameInput = document.getElementById('nameInput');
    const name = nameInput.value.trim();
    if (name && !names.includes(name)) {
        names.push(name);
        nameInput.value = '';
        drawWheel();
    }
}

function setSecretWinners(winner1, spin1, winner2, spin2) {
    secretWinners = [
        { name: winner1, spin: spin1 },
        { name: winner2, spin: spin2 }
    ];
}

function clearNames() {
    names.length = 0;
    totalSpins = 0;
    normalWinnerSequence = []; // Clear the winner sequence
    secretWinners = []; // Clear secret winners
    drawWheel();
}

function removeLastName() {
    names.pop();
    drawWheel();
}

function showWinner(winner) {
    const winnerModal = document.getElementById('winnerModal');
    const overlay = document.getElementById('overlay');
    const winnerName = document.getElementById('winnerName');
    winnerName.textContent = `The Winner Is: ${winner}`;
    winnerModal.style.display = 'block';
    overlay.style.display = 'block';
}

function closeModal() {
    const winnerModal = document.getElementById('winnerModal');
    const overlay = document.getElementById('overlay');
    winnerModal.style.display = 'none';
    overlay.style.display = 'none';

    winSound.pause(); // Stop the win sound
}

setSecretWinners('Niki', 3, 'Didi', 4);
drawWheel();
