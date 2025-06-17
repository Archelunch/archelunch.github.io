document.addEventListener('DOMContentLoaded', () => {
    // Glitch effect for the name
    const intro = document.getElementById('intro');
    if (intro) {
        const nameElement = intro.querySelector('h1');
        if (nameElement) {
            const originalName = nameElement.textContent;
            const chars = '!<>-_\\/[]{}—=+*^?#________';

            const randomChar = () => chars[Math.floor(Math.random() * chars.length)];
            const scramble = (text) => {
                let scrambledText = '';
                for (let i = 0; i < text.length; i++) {
                    scrambledText += Math.random() > 0.9 ? randomChar() : text[i];
                }
                return scrambledText;
            };

            let glitchInterval;

            nameElement.addEventListener('mouseenter', () => {
                let iteration = 0;
                glitchInterval = setInterval(() => {
                    nameElement.textContent = originalName.split('')
                        .map((letter, index) => {
                            if(index < iteration) {
                                return originalName[index];
                            }
                            return Math.random() > 0.5 ? randomChar() : letter;
                        })
                        .join('');
                    
                    if(iteration >= originalName.length){
                        clearInterval(glitchInterval);
                        nameElement.textContent = originalName;
                    }
                    
                    iteration += 1 / 3;
                }, 30);
            });

            setInterval(() => {
                nameElement.textContent = scramble(originalName);
            }, 2000);

            setInterval(() => {
                nameElement.textContent = originalName;
            }, 2100);
        }
    }

    // Sticky header
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Scroll reveal animation
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
});
