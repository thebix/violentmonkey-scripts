// ==UserScript==
// @name        Alleskinos filtering
// @namespace   Violentmonkey Scripts
// @match       https://allekinos.de/programm
// @grant       none
// @version     1.0
// @author      Pavel Biriukov
// @description 02/10/2024, 18:33:06
// ==/UserScript==

(function () {
  "use strict";

  const hiddenMoviesTableName = "hiddenMovies";
  const coloredCinemasTableName = "coloredCinemas";

  // Load hidden movies from localStorage
  let hiddenMovies = JSON.parse(
    localStorage.getItem(hiddenMoviesTableName) || "[]"
  );
  let coloredCinemas = JSON.parse(
    localStorage.getItem(coloredCinemasTableName) || "{}"
  );
  // https://www.w3schools.com/colors/colors_picker.asp
  const cinemaColors = {
    "🔴": "#ffe6e6",
    "🔵": "#e6e6ff",
  };

  const collapseExpandEmoji = " 🔃";
  const hideShowEmoji = "👁️‍🗨️";
  const downEmoji = "⏬";

  /****************************************************************************
   PROCESS MOVIES
   ****************************************************************************/

  // Function to initialize the hiding logic
  function processMovies() {
    // Get all movie titles (inside the 'h2 a' elements)
    const movies = document.querySelectorAll("div.movies div.row div.mt h2 a");

    // Remove movies that are not shown in theaters anymore
    cleanMoviesLocalStorage(movies);

    // Loop through each movie and add the hide button
    movies.forEach((movie) => {
      processMovie(movie);
    });
  }

  function processMovie(movie) {
    const movieTitle = movie.textContent.trim();

    // Check if this movie is already hidden (from localStorage)
    if (hiddenMovies.includes(movieTitle)) {
      hideMovie(movie);
    }
    createButtonArea(movie);
    createNextMovieButton(movie);
    createHideButton(movie);
  }

  function hideMovie(movie) {
    const rowElement = movie.closest(".row");
    const mpElement = rowElement.previousElementSibling; // The corresponding 'mp' element

    // Hide both the movie row and the corresponding 'mp' element
    if (rowElement) rowElement.style.display = "none";
    if (mpElement) mpElement.style.display = "none";
  }

  function showMovie(movie) {
    const rowElement = movie.closest(".row");
    const mpElement = rowElement.previousElementSibling;
    if (rowElement) rowElement.style.display = "grid";
    if (mpElement) mpElement.style.display = "block";
  }

  function isMovieHidden(movie) {
    const rowElement = movie.closest(".row");
    return rowElement.style.display == "none";
  }

  function createButtonArea(movie) {
    const br = document.createElement("br");
    const div = document.createElement("div");
    div.style.paddingTop = "5px";

    const h2Element = movie.closest("h2");
    h2Element.appendChild(br);
    h2Element.appendChild(div);
  }

  function createHideButton(movie) {
    const movieTitle = movie.textContent.trim();
    // Create a 'Hide' button
    const button = document.createElement("button");
    button.style.marginLeft = "10px";
    button.textContent = hideShowEmoji;
    button.style.cursor = "pointer";

    // Add click event to hide the movie when the button is clicked
    button.addEventListener("click", function () {
      hideMoviesByTitle(movieTitle);
      addMovieToHiddenList(movieTitle);
    });

    const buttonArea = movie.closest("h2").querySelector("div");
    // Append the hide button to the movie title
    buttonArea.appendChild(button);
  }

  function createNextMovieButton(movie) {
    // Create a 'Hide' button
    const button = document.createElement("button");
    button.textContent = downEmoji;
    button.style.cursor = "pointer";

    function skipAllMovieVariants(movie) {
      const movieTitle = movie.textContent.trim();
      const rowElement = movie.closest(".row");
      let nextRow = getNextSibling(rowElement, ".row");
      while (nextRow) {
        const nextA = nextRow.querySelector("div.mt h2 a");
        const nextTitle = nextA.textContent.trim();
        if (nextTitle != movieTitle && !isMovieHidden(nextA)) {
          return nextRow;
        }
        nextRow = getNextSibling(nextRow, ".row");
      }
      return null;
    }

    // Add click event to hide the movie when the button is clicked
    button.addEventListener("click", function () {
      const nextMovieRow = skipAllMovieVariants(movie);
      if (nextMovieRow) {
        scrollToTargetAdjusted(nextMovieRow);
      }
    });

    const buttonArea = movie.closest("h2").querySelector("div");
    // Append the hide button to the movie title
    buttonArea.appendChild(button);
  }

  // hides all movies and it's variants
  function hideMoviesByTitle(movieTitle) {
    const movies = document.querySelectorAll("div.movies div.row div.mt h2 a");
    movies.forEach((movie) => {
      if (movie.textContent.trim() === movieTitle) {
        hideMovie(movie);
      }
    });
  }

  // shows all movies and it's variants
  function showMoviesByTitle(movieTitle) {
    const movies = document.querySelectorAll("div.movies div.row div.mt h2 a");
    movies.forEach((movie) => {
      if (movie.textContent.trim() === movieTitle) {
        showMovie(movie);
      }
    });
  }

  /****************************************************************************
   END PROCESS MOVIES
   ****************************************************************************/

  /****************************************************************************
   HIDDEN MOVIES LIST
   ****************************************************************************/

  function cleanMoviesLocalStorage(movies) {
    // Get an array of movie titles from the DOM
    const movieTitlesInDOM = Array.from(movies).map((movie) =>
      movie.textContent.trim()
    );
    const movieTitlesInDOMDistinct = Array.from(new Set(movieTitlesInDOM));

    // Filter the hiddenMovies list, keeping only those that are still present in the DOM
    const updatedHiddenMovies = hiddenMovies.filter((hiddenMovie) =>
      movieTitlesInDOMDistinct.includes(hiddenMovie)
    );

    hiddenMovies = updatedHiddenMovies;

    // Update the localStorage with the cleaned hiddenMovies list
    localStorage.setItem(
      hiddenMoviesTableName,
      JSON.stringify(updatedHiddenMovies)
    );
  }

  function addMovieToHiddenList(movieTitle) {
    if (hiddenMovies.includes(movieTitle)) return;
    // Add the movie title to the hidden list and save it to localStorage
    hiddenMovies.push(movieTitle);
    localStorage.setItem(hiddenMoviesTableName, JSON.stringify(hiddenMovies));

    // Update the floating list of hidden movies
    updateHiddenMoviesList();
  }

  function removeMovieFromHiddenList(movieTitle) {
    const index = hiddenMovies.indexOf(movieTitle);
    if (index > -1) {
      hiddenMovies.splice(index, 1);
      localStorage.setItem(hiddenMoviesTableName, JSON.stringify(hiddenMovies));
    }

    // Update the floating list of hidden movies
    updateHiddenMoviesList();
  }

  // Create floating list of hidden movies
  function createHiddenMoviesList() {
    const floatingList = document.createElement("div");
    floatingList.id = "hidden-movies-list";
    floatingList.style.position = "fixed";
    floatingList.style.right = "10px";
    floatingList.style.top = "10px";
    floatingList.style.padding = "10px";
    floatingList.style.backgroundColor = "rgba(255,255,255,0.9)";
    floatingList.style.border = "1px solid #ccc";
    floatingList.style.maxWidth = "200px";
    floatingList.style.maxHeight = "80vh"; // Set max height to 80% of the viewport
    floatingList.style.overflowY = "auto"; // Enable vertical scrolling
    floatingList.style.zIndex = "1000";

    // Create the title with a toggle button
    const listTitle = document.createElement("h3");
    listTitle.textContent = "Hidden Movies";
    listTitle.style.cursor = "pointer"; // Make it look clickable

    // Create a toggle button (initially "Show")
    const toggleButton = document.createElement("span");
    toggleButton.textContent = collapseExpandEmoji;
    listTitle.appendChild(toggleButton);

    // Add the list title to the floating list
    floatingList.appendChild(listTitle);

    // Create the movie list (initially hidden)
    const movieList = document.createElement("ul");
    movieList.style.display = "none"; // Initially hidden
    floatingList.appendChild(movieList);

    // Add the floating list to the DOM
    document.body.appendChild(floatingList);

    // Update the list when required
    updateHiddenMoviesList();

    // Add event listener to toggle visibility of movie list
    listTitle.addEventListener("click", function () {
      if (movieList.style.display === "none") {
        movieList.style.display = "block"; // Show the list
        toggleButton.textContent = collapseExpandEmoji;
      } else {
        movieList.style.display = "none"; // Hide the list
        toggleButton.textContent = collapseExpandEmoji;
      }
    });
  }

  function updateHiddenMoviesList() {
    const movieList = document.querySelector("#hidden-movies-list ul");
    movieList.innerHTML = "";

    hiddenMovies.forEach((hiddenMovie) => {
      const listItem = document.createElement("li");

      const title = document.createElement("span");
      title.textContent = " " + hiddenMovie;
      title.style.marginLeft = "5px";

      const showButton = document.createElement("button");
      showButton.textContent = hideShowEmoji;
      showButton.style.cursor = "pointer";

      showButton.addEventListener("click", function () {
        // Unhide the movie in the DOM
        showMoviesByTitle(hiddenMovie);

        // Remove from hiddenMovies and update localStorage
        removeMovieFromHiddenList(hiddenMovie);
      });

      listItem.appendChild(showButton);
      listItem.appendChild(title);
      movieList.appendChild(listItem);
    });
  }

  /****************************************************************************
   END HIDDEN MOVIES LIST
   ****************************************************************************/

  /****************************************************************************
   PROCESS CINEMAS
   ****************************************************************************/

  function processCinemas() {
    const cinemas = document.querySelectorAll("div.movies div.row div.c > a");
    cinemas.forEach((cinema) => {
      processCinema(cinema);
      colorCinema(cinema);
    });
  }

  function processCinema(cinema) {
    cinemaButtons(cinema);
  }

  function cinemaButtons(cinema) {
    const cinemaTitle = cinema.textContent.trim();
    // create button area
    const span = document.createElement("span");
    span.style.marginLeft = "5px";

    const divCElement = cinema.closest("div.c");
    const divAddress = divCElement.querySelector("div");
    //divCElement.insertBefore(span, divAddress);
    divAddress.appendChild(span);

    Object.keys(cinemaColors).forEach((buttonKey) => {
      createButton(divCElement, span, buttonKey, (buttonText) => {
        toggleCinemaColor(cinemaTitle, buttonKey);
        console.log(buttonText);
      });
    });
  }

  function createButton(parentToHover, parent, buttonText, callback) {
    // Create a button
    const button = document.createElement("button");
    button.style.marginRight = "10px";
    button.textContent = buttonText;
    button.style.cursor = "pointer";
    // make transparent
    button.style.background = "none";
    button.style.border = "none";

    // Add click event to hide the movie when the button is clicked
    button.addEventListener("click", function () {
      callback(buttonText);
    });

    // Initially hide the button
    button.style.display = "none";
    // Add hover event listeners on the parent to show/hide the button
    parentToHover.addEventListener("mouseenter", () => {
      button.style.display = "inline"; // Show the button on hover
    });
    parentToHover.addEventListener("mouseleave", () => {
      button.style.display = "none"; // Hide the button when hover ends
    });

    // Append the hide button to the movie title
    parent.appendChild(button);
  }

  function toggleCinemaColor(cinemaTitle, buttonKey) {
    if (coloredCinemas[cinemaTitle] == null)
      coloredCinemas[cinemaTitle] = buttonKey;
    else if (coloredCinemas[cinemaTitle] != buttonKey)
      coloredCinemas[cinemaTitle] = buttonKey;
    else delete coloredCinemas[cinemaTitle];

    // Update the localStorage with the cleaned hiddenMovies list
    localStorage.setItem(
      coloredCinemasTableName,
      JSON.stringify(coloredCinemas)
    );
    colorCinemas();
  }

  function colorCinema(cinema) {
    const cinemaTitle = cinema.textContent.trim();
    const divCElement = cinema.closest("div.c");
    const color = coloredCinemas[cinemaTitle]
      ? cinemaColors[coloredCinemas[cinemaTitle]]
      : null;

    divCElement.style.backgroundColor = color;
    getNextSiblingsUntil(divCElement, "div").forEach((sibling) => {
      sibling.style.backgroundColor = color;
    });
  }

  function colorCinemas() {
    const cinemas = document.querySelectorAll("div.movies div.row div.c > a");
    cinemas.forEach((cinema) => {
      colorCinema(cinema);
    });
  }

  /****************************************************************************
   END PROCESS CINEMAS
   ****************************************************************************/

  /****************************************************************************
   HELPERS
   ****************************************************************************/

  function getNextSibling(elem, selector) {
    // Get the next sibling element
    var sibling = elem.nextElementSibling;

    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
      if (sibling.matches(selector)) return sibling;
      sibling = sibling.nextElementSibling;
    }
  }

  function getNextSiblingsUntil(elem, untilSelector) {
    const nextElements = [];
    // Get the next sibling element
    var sibling = elem.nextElementSibling;

    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
      if (sibling.matches(untilSelector)) return nextElements;
      nextElements.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    return nextElements;
  }

  function scrollToTargetAdjusted(target) {
    var headerOffset = 56;
    var elementPosition = target.getBoundingClientRect().top;
    var offsetPosition = elementPosition + window.scrollY - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }

  /****************************************************************************
   END HELPERS
   ****************************************************************************/

  /****************************************************************************
   START SCRIPT
   ****************************************************************************/

  // Initialize floating list and buttons
  function runScript() {
    console.log("Alleskinos filtering IS RUNNING");
    createHiddenMoviesList();
    processMovies();
    processCinemas();
  }

  /****************************************************************************
   END START SCRIPT
   ****************************************************************************/

  runScript();
})();
