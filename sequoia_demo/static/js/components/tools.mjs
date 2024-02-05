
let isDASOn = true;

// READ WITH KAFKA
    // Attach click event to the read button
    $("#readButton").on("click", function() {
      console.log("readbutton click")
      toggleDASRead();
  });
  
  // Function to toggle DAS state
function toggleDASRead() {
  // Check if reading DAS is currently ON or OFF
  const isReadOn = $("#readButton").hasClass("active");

  if (isReadOn) {
      // reading DAS is currently ON, turn it OFF
      dontreadDAS();
      $("#readButton").removeClass("active").text("READING");
  } else {
      // reading DAS is currently OFF, turn it ON
      readDAS();
      $("#readButton").addClass("active").text("NOT READING");
  }
}


// COMMUNICATION WITH KAFKA
    // Attach click event to the power button
    $("#powerButton").on("click", function() {
      console.log("powerbutton click")
      toggleDAS();
      
  });

// Function to toggle DAS state
function toggleDAS() {
  // Check if DAS is currently ON or OFF
  // const isDASOn = $("#powerButton").hasClass("active");
  isDASOn = !isDASOn;

  if (isDASOn) {
      // DAS is currently ON, turn it OFF
      stopDAS();
      $("#powerButton").addClass("active").text("OFF");
  } else {
      // DAS is currently OFF, turn it ON
      startDAS();
      $("#powerButton").removeClass("active").text("ON");
  }

  updateReadButtonVisibility() 
}

function updateReadButtonVisibility() {
  const readButton = $("#readButton");
  if (isDASOn) {
    readButton.addClass("hidden");  // Affichez le bouton READ
  } else {
    readButton.removeClass("hidden");  // Cachez le bouton READ
  }
}

// Function to start the DAS
function startDAS() {
  // Start the DAS from API of SERVER (backend folder)
    console.log("start");

    fetch('http://localhost:5000/startDAS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from server:', data);

        // Afficher les données dans la console (vous pouvez également les utiliser ailleurs dans votre application)
        if (data.result) {
            console.log('Data from server:', data.result);
            
            // Exemple : Afficher les données dans une div avec l'id "dataContainer"
            document.getElementById("dataContainer").innerText = JSON.stringify(data.result);
        }

        // Handle the response as needed
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle errors
    });
    
  }

  
  // Function to stop the DAS
  function stopDAS() {
    console.log("stop")
    fetch('http://localhost:5000/stopDAS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // You can include additional data in the body if needed
      body: JSON.stringify({}),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Response from server:', data);
      // Handle the response as needed
    })
    .catch(error => {
      console.error('Error:', error);
      // Handle errors
    });
    
  }

// Function to start the DAS
function readDAS() {
  // Start the DAS from API of SERVER (backend folder)
    console.log("start to read DAS");

    fetch('http://localhost:5050/readDAS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from server:', data);

        // Afficher les données dans la console (vous pouvez également les utiliser ailleurs dans votre application)
        if (data.result) {
            console.log('Data from server:', data.result);
            
            // Exemple : Afficher les données dans une div avec l'id "dataContainer"
            document.getElementById("dataContainer").innerText = JSON.stringify(data.result);
        }

        // Handle the response as needed
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle errors
    });
  }

  // Function to stop the DAS
  function dontreadDAS() {
    console.log("stop")
    fetch('http://localhost:5050/dontreadDAS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // You can include additional data in the body if needed
      body: JSON.stringify({}),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Response from server:', data);
      // Handle the response as needed
    })
    .catch(error => {
      console.error('Error:', error);
      // Handle errors
    });
  }

// DATA DOWNSAMPLING FOR VIEW

function decimateObject(obj, decimation) {
    const result = {};
    
    // Parcourir les clés de l'objet
    for (const key in obj) {
        
        if (Object.hasOwnProperty.call(obj, key)) {
            // Récupérer la valeur associée à la clé
            const value = obj[key];

            // Vérifier si la valeur est un tableau et a une longueur
            if (Array.isArray(value) && value.length > 0) {
                // Conserver une ligne sur "decimation" (sauter les autres lignes)
                if(key=="sensors")
                {
                    const decimatedArray = value.filter((_, index) => index % decimation === 0);                
                    // Ajouter la clé et le nouveau tableau résultant au résultat
                    result[key] = decimatedArray;
                }
                else {result[key] = value;}
            } else {
                // Si la valeur n'est pas un tableau, simplement l'ajouter au résultat
                result[key] = value;
            }
        }
    }

    return result;
}

export { 
    decimateObject, startDAS, stopDAS
};

