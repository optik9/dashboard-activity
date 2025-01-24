import React, { useState } from "react";
import Papa from "papaparse"; // Para CSV
import * as XLSX from "xlsx"; // Para Excel
import axios from "axios"; // Para realizar la solicitud al backend

function UploadJson() {
  const [file, setFile] = useState(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
  };

  const handleProcessFile = async () => {
    if (!file) {
      alert("Por favor selecciona un archivo");
      return;
    }

    const fileExtension = file.name.split(".").pop();
    let data = [];

    if (fileExtension === "csv") {
      // Procesar CSV
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          data = results.data;
          sendToServer(data);
        },
        error: (err) => console.error("Error al procesar CSV:", err),
      });
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      // Procesar Excel
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
        sendToServer(data);
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Por favor selecciona un archivo CSV o Excel.");
    }
  };

  const sendToServer = async (data) => {
    try {
      const response = await axios.post("http://localhost:5000/upload-json", {
        data,
        fileName: file.name.replace(/\.\w+$/, ".json"), // Reemplaza la extensión por .json
      });

      alert(response.data.message);
    } catch (error) {
      console.error("Error al enviar los datos al servidor:", error);
      alert("Error al guardar el archivo en el servidor.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Subir Archivo CSV - Guardar como JSON</h2>
      <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
      <button onClick={handleProcessFile} style={{ marginLeft: "10px" }}>
        Procesar y Guardar JSON
      </button>
    </div>
  );
}

export default UploadJson;