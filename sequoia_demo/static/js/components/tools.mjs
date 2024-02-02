
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
    decimateObject
};

