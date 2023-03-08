const ProgressBar = function(parentElement, label) {
	let totalWidth = label.offsetWidth;
	const labelProgressBar = document.createElement('div');
	labelProgressBar.className = 'label-progress-bar';

	const span = document.createElement('span');
	span.innerText = label.innerText;
	span.style.width = totalWidth.toString() + 'px';

	labelProgressBar.appendChild(span);
	parentElement.style.position = 'relative';
	parentElement.appendChild(labelProgressBar);

	this.container = labelProgressBar;
	this.element = span;
	this.updateText = function(text) {
		label.innerText = span.innerText = text;
		totalWidth = label.offsetWidth;
		span.style.width = totalWidth.toString() + 'px';
	}
	this.handleProgress = function(percentage) {
		const width = totalWidth * percentage;
		labelProgressBar.style.width = width.toString() + 'px';
	}
	this.reset = () => labelProgressBar.style.width = '0';
}

window.addEventListener('load', () => {
	const container = document.getElementById('container');
	const buttons = container.getElementsByTagName('button');
	const inputs = container.getElementsByTagName('input');

	for (const button of buttons) {
		button.onmouseup = () => button.blur();
		button.onclick = () => console.log('clicked');
		button.onmousedown = () => console.log('mousedown');
		button.onkeydown = event => {
			const code = event.keyCode;
			if (code == 13 || code == 32)
				button.className = 'activate-inside';
		}
		button.onkeyup = event => {
			button.className = '';
		}
	}

	const radioGroupMap = new Map();
	const rangeStates = {};

	const insertProgressBar = (parentElement, label) => {
		const labelProgressBar = document.createElement('div');
		labelProgressBar.className = 'label-progress-bar';

		const span = document.createElement('span');
		span.innerText = label.innerText;
		span.style.width = label.offsetWidth.toString() + 'px';

		labelProgressBar.appendChild(span);
		parentElement.style.position = 'relative';
		parentElement.appendChild(labelProgressBar);

		return {
			container: labelProgressBar,
			label: span,
			updateText: function(text) {
			},
			handleProgress: function(percentage) {
				span.innerText = label.innerText;
				const width = label.offsetWidth * percentage;
				labelProgressBar.style.width = width.toString() + 'px';
			},
			reset: function() { labelProgressBar.style.width = '0' }
		}
	}

	for (const input of inputs) {
		const parent = input.parentElement;
		const label = input.nextElementSibling;
		label.onclick = event => event.preventDefault();
		label.onmousedown = () => input.click();

		const type = input.type;
		if (type == 'color') {
			const setColorInputStyle = () => {
				const hexString = input.value;
				const hex = parseInt('0x' + hexString.substring(1), 16);
				const rValue = hex >> 16;
				const gValue = (hex >> 8) & 0xff;
				const bValue = hex & 0xff;
				const brightness = Math.max(rValue, gValue, bValue) / 255;
				const threshold = 0.5;
				// if (brightness > threshold) label.style.color = 'black';
				// else label.style.color = 'white';
				label.innerText = hexString;
				label.style.color = hexString;
			}
			input.value = ('#ff0000');
			setColorInputStyle();
			input.oninput = setColorInputStyle;
		}

		else if (type == 'radio') {
			input.checked = false;
			let group = radioGroupMap.get(input.name);
			if (!group) {
				parent.className = 'radio-group';
				group = { container: parent, inputs: [input] };
				radioGroupMap.set(input.name, group);
			}
			else group.inputs.push(input);

			input.onfocus = () => group.container.className = 'radio-group ' + 'activate-border';
			input.onblur = () => group.container.className = 'radio-group';
		}

		else if (type == 'range') {
			const inputMin = parseInt(input.min || '0');
			const inputMax = parseInt(input.max || '100');
			const inputStep = parseInt(input.step || '1');

			// const progressBar = insertProgressBar(parent, label);
			const progressBar = new ProgressBar(parent, label);
			const progressLabel = progressBar.element;
			const labelWidth = label.offsetWidth;

			const states = {
				focus: false,
				hover: false,
				active: false
			}
			const handleBorderActivation = (stateName, state) => {
				states[stateName] = state
				if (states.focus || states.hover || states.active) label.className = progressLabel.className = 'activate-border';
				else label.className = progressLabel.className = '';
			}
			input.addEventListener('focusin', () => handleBorderActivation('focus', true));
			input.addEventListener('focusout', () => handleBorderActivation('focus', false));
			label.addEventListener('mouseenter', () => handleBorderActivation('hover', true));
			label.addEventListener('mouseleave', () => handleBorderActivation('hover', false));
			progressLabel.addEventListener('mouseenter', () => handleBorderActivation('hover', true));
			progressLabel.addEventListener('mouseleave', () => handleBorderActivation('hover', false));

			const getPercentage = value => (value - inputMin) / (inputMax - inputMin);

			const handleRangeInput = () => {
				const percentage = getPercentage(parseInt(input.value));
				progressBar.handleProgress(percentage);
			}
			handleRangeInput();
			input.oninput = handleRangeInput;

			const handleMouseEvents = event => {
				handleBorderActivation('active', true);
				const startX = event.clientX;
				const startRelativeX = startX - label.offsetLeft;
				const startValue = parseInt(input.value);
				let currentValue = startValue;
				const startPercentage = getPercentage(startValue);

				window.onmousemove = event => {
					const currentX = event.clientX;
					const displacementPercentage = (currentX - startX) / labelWidth;
					// const displacement = currentX - startX;
					// const displacementFactor = displacement / labelWidth;

					// For affecting the input value
					let currentPercentage = startPercentage + displacementPercentage;
					if (currentPercentage < 0) currentPercentage = 0;
					else if (currentPercentage > 1) currentPercentage = 1;
					const newValue = Math.round(inputMin + currentPercentage * (inputMax - inputMin));
					if (newValue % inputStep == 0 && newValue != currentValue) {
						input.value = newValue.toString(); // Browser does the rounding and accounts for input.step I guess
						handleRangeInput();
						currentValue = newValue;
					}
				}
				window.onmouseup = () => {
					handleBorderActivation('active', false);
					window.onmouseup = null;
					window.onmousemove = null;
				};
			};
			label.onmousedown = handleMouseEvents;
			progressLabel.onmousedown = handleMouseEvents;
		}

		else if (type == 'file') {
			// const progressBar = insertProgressBar(parent, label);
			const progressBar = new ProgressBar(parent, label);
			input.addEventListener('change', async function() {
				const file = this.files[0];
				progressBar.updateText('uploading...');
				this.disabled = true;

				return new Promise(resolve => {
					let i = 1;
					const interval = setInterval(() => {
						progressBar.handleProgress(i / 100);
						i++;
						if (i > 100) {
							this.disabled = false;
							progressBar.updateText('done.');
							progressBar.reset();
							setTimeout(() => {
								progressBar.updateText('file');
							}, 1000);
							clearInterval(interval);
							resolve();
						}
					}, 20);
				});
			});
		}
	}
	console.log(rangeStates);
});

