// IMPORTS & CONFIGS
// Imports
import {PrismaClient} from '@prisma/client'; //C onexión a la base de datos
import * as fs from 'fs'; // Leer archivos   
import * as path from 'path'; // Manejar rutas de archivos

// Config
const prisma = new PrismaClient(); // Abrir acceso a PostgreSQL
const seedDir = __dirname; // Directorio actual (src/seed)

// FUNCIÓN PRINCIPAL

async function main() {
    console.log('--- Iniciando proceso de seed ---');

    // Paso 1: Limpiar tabla Question (para evitar duplicados)
    await prisma.question.deleteMany({});
    console.log('Tabla Question limpiada.');

    // Paso 2: Leer carpetas dentro de seed/
    const carpetas = fs.readdirSync(seedDir);
    console.log(`Carpetas encontradas en seed/: ${carpetas.join(', ')}`);

    // Paso 3: Ignorar archivos que no son carpetas
    const carpetasAsignaturas = carpetas.filter((nombre) => {
        const itemPath = path.join(seedDir, nombre);
        return fs.lstatSync(itemPath).isDirectory();
    });
    
    console.log(`Carpetas válidas (excluyendo archivos): ${carpetasAsignaturas.join(', ')}`);

    // Paso 4: Procesar cada carpeta
    for (const carpeta of carpetasAsignaturas) {
        console.log(`\nProcesando carpeta: ${carpeta}`);

        // Leer contenido en la carpeta
        const rutaCarpeta = path.join(seedDir, carpeta);
        const archivos = fs.readdirSync(rutaCarpeta);

        // Paso 5: Filtrar solo archivos .json
        const archivosJson = archivos.filter((archivo) => archivo.endsWith('.json'));
        console.log(`Archivos JSON encontrados: ${archivosJson.join(', ')}`);

    // Paso 6: Procesar cada archivo JSON
    for (const archivoJson of archivosJson) {
        console.log(`\nInsertando datos del archivo: ${archivoJson}`);

        const rutaArchivo = path.join(rutaCarpeta, archivoJson); // <- Ruta completa al archivo
        const contenido = fs.readFileSync(rutaArchivo, 'utf-8'); // <- Leer contenido
        const data = JSON.parse(contenido); // <- Parsear JSON

        if (!data.subjects || !Array.isArray(data.subjects)) {
            console.warn(`ADVERTENCIA: El archivo ${archivoJson} no tiene el formato esperado. `);
            continue; // Saltar este archivo y continuar con el siguiente
        }

        // Paso 7: Recorrer subjetcts
        for (const subject of data.subjects) {
            const subjectCode = subject.code; // Código de la asignatura
            const subjectName = subject.name; // Nombre de la asignatura

            console.log(`    📚 Asignatura: ${subjectCode} - ${subjectName}`);

            // Paso 8: Recorrer topics (temas) dentro de cada subject
            for (const topic of subject.topics) {
                const topicNumber = topic.number; // Número del tema
                const topicTitle = topic.title; // Nombre del tema

                console.log(`  Tema ${topicNumber}: ${topicTitle}`);

                // Paso 9: Recorrer questions (preguntas) dentro de cada topic
                for (const question of topic.questions) {
                    // Paso 10: Insertar pregunta en PostgreSQL
                        await prisma.question.create({
                            data: {
                                subjectCode: subjectCode,
                                subjectName: subjectName,
                                topicNumber: topicNumber,
                                topicTitle: topicTitle,
                                text: question.text,
                                options: question.options,           // Array JSON
                                correctAnswer: question.correctAnswer,
                                explanation: question.explanation,
                                failedCount: 0                       // Inicializado a 0
                            }
                        });
                        
                        console.log(`        ✅ Pregunta insertada: "${question.text.substring(0, 50)}..."`);
                    } // Fin for questions
                } // Fin for topics
            } // Fin for subjects
        } // Fin for archivosJson
    } // Fin for carpetasAsignaturas

    console.log('\n--- Proceso de seed finalizado ---');
} // Fin función main

// EJECUCIÓN DE LA FUNCIÓN PRINCIPAL

main()
    .then(async () => {
        await prisma.$disconnect(); // Cerrar conexión a PostgreSQL
        console.log('Conexión a PostgreSQL cerrada.');
    })
    .catch(async (error) => {
        console.error('Error durante el proceso de seed:', error);
        await prisma.$disconnect(); // Cerrar conexión a PostgreSQL
        process.exit(1); // Salir con código de error
    });

// NOTA: Ejecutar este script con "npm run seed" desde la
// terminal en la carpeta backend/
// (asegurarse de tener PostgreSQL en ejecución)




      
