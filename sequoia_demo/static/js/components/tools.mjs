// COMMUNICATION WITH KAFKA
    // Attach click event to the power button
    $("#powerButton").on("click", function() {
      toggleDAS();
  });

// Function to toggle DAS state
function toggleDAS() {
  // Check if DAS is currently ON or OFF
  const isDASOn = $("#powerButton").hasClass("active");

  if (isDASOn) {
      // DAS is currently ON, turn it OFF
      stopDAS();
      $("#powerButton").removeClass("active").text("ON");
  } else {
      // DAS is currently OFF, turn it ON
      startDAS();
      $("#powerButton").addClass("active").text("OFF");
  }
}
// Function to start the DAS
function startDAS() {
  // Start the DAS from API of SERVER (backend folder)
    console.log("start")
    fetch('http://localhost:5000/startDAS', {
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

    // read the das from the application
    console.log("read");
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

