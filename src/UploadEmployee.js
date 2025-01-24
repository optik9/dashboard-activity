import React, { useState } from "react";
import Papa from "papaparse"; // Para CSV
import * as XLSX from "xlsx"; // Para Excel
import db from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

function UploadEmployee() {
  const [file, setFile] = useState(null);

  // Procesar el archivo cargado
  const handleFileUpload = async (e) => {
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
          saveToFirestore(data);
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
        saveToFirestore(data);
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Por favor selecciona un archivo CSV o Excel.");
    }
  };

  const saveToFirestore = async (data) => {
    const collectionRef = collection(db, "uploadedDataEmployee");

    try {
      for (const record of data) {
        await addDoc(collectionRef, record);
      }
      alert("Datos guardados exitosamente en Firestore.");
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      alert("Error al guardar los datos. Revisa la consola para más detalles.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Subir Archivo CSV - Employee</h2>
      <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
      <button onClick={handleProcessFile} style={{ marginLeft: "10px" }}>
        Procesar y Subir
      </button>
    </div>
  );
}

export default UploadEmployee;