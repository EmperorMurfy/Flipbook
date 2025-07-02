document.addEventListener("DOMContentLoaded", function() {
    // References to DOM Elements
    const book = document.querySelector("#book");
    const numOfImages = 5; // Set this to your total number of images

    let currentLocation = 1;
    let maxLocation = numOfImages + 1;
    let papers = [];
    let isAnimating = false; // Add this at the top with your other variables
    let flipQueue = [];

    // helper func -> file type jpg, png, webq (fallback order)
    function createImageWithFallback(index, alt) {
        const img = document.createElement("img");
        img.src = `images/${index}.webp`;
        img.alt = alt;
        img.style.width = "100%";
        img.style.height = "100%";
        img.onerror = function () {
            if (img.src.endsWith('.webp')) {
                img.src = `images/${index}.jpg`;
            } else if (img.src.endsWith('.jpg')) {
                img.src = `images/${index}.png`;
            } else {
                console.error(`Image not found for index ${index}`);
                img.onerror = null; // Prevent infinite loop
            }
        };
        return img;
    }

    // helper func -> add image to page
    // isOdd: true for front (odd), false for back (even)
    function addPageWithImage(contentDiv, img, isOdd) {
        const bg = document.createElement("div");
        bg.className = "page-bg " + (isOdd ? "odd" : "even");
        contentDiv.insertBefore(bg, contentDiv.firstChild);
        contentDiv.appendChild(img);
    }

    // task -> create pages dynamically
    // Odd pages (front) and even pages (back)
    for (let i = 1; i <= numOfImages; i += 2) {
        const paper = document.createElement("div");
        paper.className = "paper";
        paper.id = `p${Math.ceil(i / 2)}`;

        // Front
        const front = document.createElement("div");
        front.className = "front";
        const frontContent = document.createElement("div");
        frontContent.className = "front-content";
        const frontImg = createImageWithFallback(i, `Page ${i}`);
        addPageWithImage(frontContent, frontImg, true); // odd/front
        front.appendChild(frontContent);

        // Back
        const back = document.createElement("div");
        back.className = "back";
        const backContent = document.createElement("div");
        backContent.className = "back-content";
        if (i + 1 <= numOfImages) {
            const backImg = createImageWithFallback(i + 1, `Page ${i + 1}`);
            addPageWithImage(backContent, backImg, false); // even/back
        }
        back.appendChild(backContent);

        const pageSide = document.createElement('div');
    

        paper.appendChild(front);
        paper.appendChild(back);
        book.appendChild(paper);
        papers.push(paper);
    }

    // task -> sets z-index of pages (adapts dynamically) 
    papers.forEach((paper, idx) => {
        paper.style.zIndex = papers.length - idx;
    });

    // Book logic
    function openBook() {
        book.style.transform = "translateX(50%)";
    }
    function closeBook(isAtBeginning) {
        if (isAtBeginning) {
            book.style.transform = "translateX(0%)";
        } else {
            book.style.transform = "translateX(100%)";
        }
    }

    // function -> updates z-index of papers based on flipped state
    function updatePaperStack() {
        const unflipped = [];
        const flipped = [];
        papers.forEach(paper => {
            if (paper.classList.contains("flipped")) {
                flipped.push(paper);
            } else {
                unflipped.push(paper);
            }
        });

        // Unflipped: highest z-index (on top)
        unflipped.forEach((paper, idx) => {
            paper.style.zIndex = papers.length - idx;
        });

        // Flipped: lowest z-index (on bottom)
        flipped.forEach((paper, idx) => {
            paper.style.zIndex = idx + 1;
        });
    }

    function goNextPage(fromQueue = false) {
        if (isAnimating && !fromQueue) return;
        if (currentLocation < maxLocation) {
            setIsAnimating(true);
            console.log("isAnimating:", isAnimating);
            if (currentLocation === 1) openBook();
            if (currentLocation <= papers.length) {
                papers[currentLocation - 1].style.zIndex = papers.length + 1;
                papers[currentLocation - 1].classList.add("flipped");
                setTimeout(() => {
                    updatePaperStack();
                    setIsAnimating(false);
                    console.log("isAnimating:", isAnimating);
                    currentLocation++;
                    processFlipQueue();
                }, 1200);
            } else {
                setIsAnimating(false);
                console.log("isAnimating:", isAnimating);
                processFlipQueue();
            }
            if (currentLocation === numOfImages) closeBook(false);
        }
    }

    function goPrevPage(fromQueue = false) {
        if (isAnimating && !fromQueue) return;
        if (currentLocation > 1) {
            setIsAnimating(true);
            console.log("isAnimating:", isAnimating);
            if (currentLocation === 2) closeBook(true);
            if (currentLocation > 1 && currentLocation <= papers.length + 1) {
                papers[currentLocation - 2].style.zIndex = papers.length + 1;
                papers[currentLocation - 2].classList.remove("flipped");
                setTimeout(() => {
                    updatePaperStack();
                    setIsAnimating(false);
                    console.log("isAnimating:", isAnimating);
                    currentLocation--;
                    processFlipQueue();
                }, 1200);
            } else {
                setIsAnimating(false);
                console.log("isAnimating:", isAnimating);
                processFlipQueue();
            }
            if (currentLocation === numOfImages + 1) openBook();
        }
    }

    papers.forEach((paper, idx) => {
        const front = paper.querySelector('.front');
        const back = paper.querySelector('.back');

        // Always queue a forward flip if the front is clicked and not already flipped
        front.addEventListener('click', () => {
            if (!paper.classList.contains("flipped")) {
                flipQueue.push("next");
                processFlipQueue();
            }
        });

        // Always queue a backward flip if the back is clicked and is flipped
        back.addEventListener('click', () => {
            if (paper.classList.contains("flipped")) {
                flipQueue.push("prev");
                processFlipQueue();
            }
        });
    });

    function processFlipQueue() {
        if (isAnimating || flipQueue.length === 0) return;
        const direction = flipQueue.shift();
        if (direction === "next") {
            goNextPage(true);
        } else if (direction === "prev") {
            goPrevPage(true);
        }
    }

    // Initial stack order
    updatePaperStack();

    // disable right-click context menu
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });

    document.addEventListener("dragstart", function (e) {
        if (e.target.tagName === "IMG") {
            e.preventDefault();
        }
    });


    // Checkbox and cover animation logic
    const checkbox = document.querySelector("#checkbox-cover");
    const cover = document.querySelector(".cover");

    if (checkbox && cover && !isAnimating) {
        checkbox.addEventListener('change', function () {
            book.classList.add('disabled');
            if (checkbox.checked) {
                isAnimating = true;
                console.log("isAnimating:", isAnimating); // debug
                cover.classList.add('open');
                setTimeout(() => {
                    isAnimating = false;
                    console.log("isAnimating:", isAnimating); // debug
                    book.classList.remove('disabled');
                }, 1500);
            } else {
                isAnimating = true;
                console.log("isAnimating:", isAnimating); // debug

                state = jumpToFirstPage(); 

                if (state) {
                    setTimeout(() => {
                        cover.classList.remove('open');
                        setTimeout(() => {
                            isAnimating = false;
                            
                            // debug
                            book.classList.remove('disabled'); 
                            console.log("isAnimating:", isAnimating); 
                        }, 1500);
                    }, 1500);
                } else {
                    cover.classList.remove('open');
                    isAnimating = false;
                    
                    // debug
                    book.classList.remove('disabled'); 
                    console.log("isAnimating:", isAnimating); 
                }
            }
        });
    }

    // redudant (individually flips to P1 from Pn)
    function queueToFirstPage() {
        const flipsNeeded = currentLocation - 1;
        if (flipsNeeded > 0) {
            console.log(`Queueing ${flipsNeeded} flips to reach p1 from p${currentLocation}`); // debug
            for (let i = 0; i < flipsNeeded; i++) {
                flipQueue.push("prev");
            }
            processFlipQueue();
        } else {
            console.log("Already on p1, no flips needed."); // debug
        }
    }    

    // function -> replaces queueToFirstPage, one flip to P1 from PN and closes cover 
    function jumpToFirstPage() {
        const flipsNeeded = currentLocation - 1;

        if (flipsNeeded > 0) {
            console.log(`Jumping instantly to p1 from p${currentLocation}`); // debug
            papers.forEach((paper, idx) => {
                if (idx === 0) {
                    paper.classList.remove("flipped");
                } else {
                    paper.classList.remove("flipped");
                }
            });
            currentLocation = 1;
            updatePaperStack();
            return true;
        } else {
            console.log("Already on p1, no jump needed."); // debug
            return false;
        }
    }

    // function -> sets isAnimating state and disables checkbox
    function setIsAnimating(value) {
        isAnimating = value;
        if (checkbox) checkbox.disabled = isAnimating;
    }

    // (REDUDANT) function -> queues flips to P1 from PN and closes cover
    function queueToFirstPageAndCloseCover() {
        // Queue enough "prev" actions to reach p1
        while (currentLocation > 1) {
            flipQueue.push("prev");
        }
        // After all flips, queue a cover close
        coverQueue.push("close");
        processFlipQueue();
        processCoverQueue();
    }

    // effect -> cover shadow
    const coverShadow = document.createElement('div');
    coverShadow.className = 'cover-shadow';
    book.appendChild(coverShadow);

    // howler -> sound effects, github instructions here: https://github.com/goldfire/howler.js 
    // ex: 
    var music = new Howl({
        src: ['sounds/music.mp3'], // file path (sounds/file_name.file_type)
        volume: 0.5, // adjust volume as needed
        loop: true, // set to true if you want the sound to loop
        //  html5: true, // use HTML5 audio for better performance on mobile devices
        onload: function() {
            console.log('Sound loaded successfully'); // debug
        }
    });

    const backgroundPlaylistArray = ['sounds/track1.mp3', 'sounds/track2.mp3', 'sounds/track3.mp3', `sounds/track4.mp3`, 'sounds/track5.mp3'];
    const backgroundPlaylist = createMusicPlaylist(backgroundPlaylistArray, true, 0.5);
 

    // dependency function -> enables howler.js to play music playlists 
    function createMusicPlaylist(playlistArray, loop = true, volume = 0.5) {
        let currentTrack = 0;
        let howl = null;
        let isPlaying = false;

        function playNextTrack() {
            if (howl) {
                howl.unload();
            }
            howl = new Howl({
                src: [playlistArray[currentTrack]],
                volume: volume,
                onend: function() {
                    currentTrack++;
                    if (currentTrack >= playlistArray.length) {
                        if (loop) {
                            currentTrack = 0;
                            playNextTrack();
                        } else {
                            isPlaying = false;
                        }
                    } else {
                        playNextTrack();
                    }
                }
            });
            howl.play();
            isPlaying = true;
        }

        return {
            play: function() {
                if (!howl) {
                    playNextTrack(); // nothing loaded yet
                } else if (!isPlaying) {
                    howl.play(); // resume from pause
                    isPlaying = true;
                }
                // else: already playing, do nothing
            },
            pause: function() {
                if (howl) howl.pause();
                isPlaying = false;
            },
            stop: function() {
                if (howl) howl.stop();
                isPlaying = false;
            },
            next: function() {
                if (howl) howl.stop();
                currentTrack = (currentTrack + 1) % playlistArray.length;
                playNextTrack();
            },
            prev: function() {
                if (howl) howl.stop();
                currentTrack = (currentTrack - 1 + playlistArray.length) % playlistArray.length;
                playNextTrack();
            },
            setVolume: function(v) {
                volume = v;
                if (howl) howl.volume(v);
            }
        };
    }

    // function -> handles gif loop toggle & music play/pause
    const gif = document.getElementById('bottom-gif');
    let gifPlaying = false;

    if (gif) {
        gif.addEventListener('click', function() {
            gifPlaying = !gifPlaying;
            if (gifPlaying) {
                gif.src = 'images/loop.gif';
                backgroundPlaylist.play();  
            } else {
                gif.src = 'images/loop-static.webp';
                backgroundPlaylist.pause();
            }
            // toggle shadow effect
            gif.classList.add('active');
            setTimeout(() => gif.classList.remove('active'), 300); 
        });
    }
});