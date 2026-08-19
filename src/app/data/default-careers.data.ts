import { CareerPlan } from '../models/career.model';

export const AUDIOVISUAL_CAREER_PLAN: CareerPlan = {
  id: 'lic-diseno-audiovisual',
  name: 'Licenciatura en Diseño Audiovisual',
  university: 'Universidad Nacional de Río Negro',
  version: '2023',
  courses: [
    {
      id: 1,
      name: 'Producción Audiovisual 1',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'PA1-L1', professor: 'Dr. Carlos Mendez', day: 0, startTime: '08:00', endTime: '12:00' },
        { id: 'PA1-L2', professor: 'Dr. Carlos Mendez', day: 1, startTime: '13:00', endTime: '17:00' },
        { id: 'PA1-L3', professor: 'Dr. Carlos Mendez', day: 2, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 2,
      name: 'Escritura Audiovisual 1',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'EA1-L1', professor: 'Lic. María Gutiérrez', day: 1, startTime: '08:00', endTime: '12:00' },
        { id: 'EA1-L2', professor: 'Lic. María Gutiérrez', day: 2, startTime: '13:00', endTime: '17:00' },
        { id: 'EA1-L3', professor: 'Lic. María Gutiérrez', day: 3, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 3,
      name: 'Software en Edición Audiovisual',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'SEA-L1', professor: 'Ing. Roberto Flores', day: 2, startTime: '08:00', endTime: '12:00' },
        { id: 'SEA-L2', professor: 'Ing. Roberto Flores', day: 3, startTime: '13:00', endTime: '17:00' },
        { id: 'SEA-L3', professor: 'Ing. Roberto Flores', day: 4, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 4,
      name: 'Iluminación y Cámara 1',
      year: 1,
      q: 2,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'IyC1-L1', professor: 'Prof. Andrés González', day: 3, startTime: '08:00', endTime: '12:00' },
        { id: 'IyC1-L2', professor: 'Prof. Andrés González', day: 4, startTime: '13:00', endTime: '17:00' },
        { id: 'IyC1-L3', professor: 'Prof. Andrés González', day: 0, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 5,
      name: 'Historia del Arte 1',
      year: 1,
      q: 2,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'HA1-L1', professor: 'Dra. Sofía Rodriguez', day: 4, startTime: '08:00', endTime: '12:00' },
        { id: 'HA1-L2', professor: 'Dra. Sofía Rodriguez', day: 0, startTime: '13:00', endTime: '17:00' },
        { id: 'HA1-L3', professor: 'Dra. Sofía Rodriguez', day: 1, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 6,
      name: 'Sonido 1',
      year: 1,
      q: 2,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'S1-L1', professor: 'Ing. Pablo Domínguez', day: 0, startTime: '08:00', endTime: '12:00' },
        { id: 'S1-L2', professor: 'Ing. Pablo Domínguez', day: 1, startTime: '13:00', endTime: '17:00' },
        { id: 'S1-L3', professor: 'Ing. Pablo Domínguez', day: 2, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 7,
      name: 'Montaje 1',
      year: 1,
      q: 2,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'M1-L1', professor: 'Lic. Fernando Torres', day: 1, startTime: '08:00', endTime: '12:00' },
        { id: 'M1-L2', professor: 'Lic. Fernando Torres', day: 2, startTime: '13:00', endTime: '17:00' },
        { id: 'M1-L3', professor: 'Lic. Fernando Torres', day: 3, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 8,
      name: 'Proyecto Audiovisual 1',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'PROY1-L1', professor: 'Prof. Javier Morales', day: 2, startTime: '08:00', endTime: '12:00' },
        { id: 'PROY1-L2', professor: 'Prof. Javier Morales', day: 3, startTime: '13:00', endTime: '17:00' },
        { id: 'PROY1-L3', professor: 'Prof. Javier Morales', day: 4, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 9,
      name: 'Iluminación y Cámara 2',
      year: 2,
      q: 1,
      cursarReqId: [4],
      aprobarReqId: [4],
      lessons: [
        { id: 'IyC2-L1', professor: 'Prof. Andrés González', day: 3, startTime: '08:00', endTime: '12:00' },
        { id: 'IyC2-L3', professor: 'Prof. Andrés González', day: 0, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 10,
      name: 'Sonido 2',
      year: 2,
      q: 1,
      cursarReqId: [6],
      aprobarReqId: [6],
      lessons: [
        { id: 'S2-L1', professor: 'Ing. Pablo Domínguez', day: 4, startTime: '08:00', endTime: '12:00' },
        { id: 'S2-L3', professor: 'Ing. Pablo Domínguez', day: 1, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 11,
      name: 'Montaje 2',
      year: 2,
      q: 1,
      cursarReqId: [7, 3],
      aprobarReqId: [7, 3],
      lessons: [
        { id: 'M2-L1', professor: 'Lic. Fernando Torres', day: 0, startTime: '08:00', endTime: '12:00' },
        { id: 'M2-L3', professor: 'Lic. Fernando Torres', day: 2, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 12,
      name: 'Producción Audiovisual 2',
      year: 2,
      q: 1,
      cursarReqId: [1],
      aprobarReqId: [1],
      lessons: [
        { id: 'PA2-L1', professor: 'Dr. Carlos Mendez', day: 1, startTime: '08:00', endTime: '12:00' },
        { id: 'PA2-L3', professor: 'Dr. Carlos Mendez', day: 3, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 13,
      name: 'Software de Composición',
      year: 2,
      q: 2,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'SC-L1', professor: 'Ing. Roberto Flores', day: 2, startTime: '08:00', endTime: '12:00' },
        { id: 'SC-L3', professor: 'Ing. Roberto Flores', day: 4, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 14,
      name: 'Inglés Técnico',
      year: 2,
      q: 2,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'IT-L1', professor: 'Prof. David Mitchell', day: 3, startTime: '08:00', endTime: '12:00' },
        { id: 'IT-L3', professor: 'Prof. David Mitchell', day: 0, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 15,
      name: 'Historia del Arte 2',
      year: 2,
      q: 2,
      cursarReqId: [5],
      aprobarReqId: [5],
      lessons: [
        { id: 'HA2-L1', professor: 'Dra. Sofía Rodriguez', day: 4, startTime: '08:00', endTime: '12:00' },
        { id: 'HA2-L3', professor: 'Dra. Sofía Rodriguez', day: 1, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 16,
      name: 'Escritura Audiovisual 2',
      year: 2,
      q: 2,
      cursarReqId: [2],
      aprobarReqId: [2],
      lessons: [
        { id: 'EA2-L1', professor: 'Lic. María Gutiérrez', day: 0, startTime: '08:00', endTime: '12:00' },
        { id: 'EA2-L3', professor: 'Lic. María Gutiérrez', day: 2, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 17,
      name: 'Proyecto Audiovisual 2',
      year: 2,
      q: 3,
      cursarReqId: [8],
      aprobarReqId: [8],
      lessons: [
        { id: 'PROY2-L1', professor: 'Prof. Javier Morales', day: 1, startTime: '08:00', endTime: '12:00' },
        { id: 'PROY2-L3', professor: 'Prof. Javier Morales', day: 3, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 18,
      name: 'Diseño Sonoro',
      year: 3,
      q: 1,
      cursarReqId: [11, 10, 7, 6, 3],
      aprobarReqId: [7, 6, 11, 10, 3],
      lessons: [
        { id: 'DS-L3', professor: 'Ing. Martín López', day: 4, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 19,
      name: 'Historia de los Medios',
      year: 3,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'HM-L3', professor: 'Dra. Beatriz Sánchez', day: 0, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 20,
      name: 'Postproducción Audiovisual 1',
      year: 3,
      q: 1,
      cursarReqId: [7, 6, 11, 10, 3, 13],
      aprobarReqId: [7, 6, 11, 10, 3, 13],
      lessons: [
        { id: 'PProd1-L3', professor: 'Ing. Rafael Castillo', day: 1, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 21,
      name: 'Nociones de Colorimetría',
      year: 3,
      q: 1,
      cursarReqId: [4, 9],
      aprobarReqId: [4, 9],
      lessons: [
        { id: 'NC-L3', professor: 'Prof. Alejandro Vargas', day: 2, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 22,
      name: 'Montaje Documental',
      year: 3,
      q: 2,
      cursarReqId: [7, 6, 11, 10, 3],
      aprobarReqId: [7, 6, 11, 10, 3],
      lessons: [
        { id: 'MD-L3', professor: 'Lic. Claudia Pérez', day: 3, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 23,
      name: 'Postproducción Audiovisual 2',
      year: 3,
      q: 2,
      cursarReqId: [7, 6, 11, 10, 3, 13],
      aprobarReqId: [7, 6, 11, 10, 3, 13],
      lessons: [
        { id: 'PProd2-L3', professor: 'Ing. Rafael Castillo', day: 4, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 24,
      name: 'Práctica Profesional',
      year: 3,
      q: 2,
      cursarReqId: [2, 1, 4, 7, 6, 8, 12, 11, 10, 9, 16, 17, 3, 13, 20],
      aprobarReqId: [2, 1, 4, 7, 6, 8, 12, 11, 10, 9, 16, 17, 3, 13, 20],
      lessons: [
        { id: 'PP-L3', professor: 'Prof. Enrique Hernández', day: 0, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 25,
      name: 'Proyecto Audiovisual 3',
      year: 3,
      q: 3,
      cursarReqId: [8, 12, 17, 1],
      aprobarReqId: [8, 12, 17, 1],
      lessons: [
        { id: 'PROY3-L3', professor: 'Prof. Javier Morales', day: 1, startTime: '18:00', endTime: '22:00' }
      ]
    }
  ]
};

export const SISTEMAS_CAREER_PLAN: CareerPlan = {
  id: 'ing-sistemas',
  name: 'Ingeniería en Sistemas de Información',
  university: 'Universidad Tecnológica Nacional',
  version: '2023',
  courses: [
    {
      id: 1,
      name: 'Análisis Matemático I',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'AMI-L1', professor: 'Dr. Jorge Rossi', day: 0, startTime: '08:00', endTime: '12:00' },
        { id: 'AMI-L2', professor: 'Dra. Maria Fernandez', day: 2, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 2,
      name: 'Álgebra y Geometría Analítica',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'AGA-L1', professor: 'Prof. Ana Martinez', day: 1, startTime: '08:00', endTime: '12:00' },
        { id: 'AGA-L2', professor: 'Lic. Roberto Gomez', day: 3, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 3,
      name: 'Física I',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'FIS1-L1', professor: 'Ing. Carlos Paez', day: 2, startTime: '08:00', endTime: '12:00' },
        { id: 'FIS1-L2', professor: 'Dr. Esteban Quito', day: 4, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 4,
      name: 'Inglés I',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'ING1-L1', professor: 'Prof. Sarah Jenkins', day: 3, startTime: '08:00', endTime: '12:00' },
        { id: 'ING1-L2', professor: 'Lic. Claudia Lopez', day: 1, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 5,
      name: 'Lógica y Estructuras Discretas',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'LED-L1', professor: 'Ing. Martín Gomez', day: 4, startTime: '08:00', endTime: '12:00' },
        { id: 'LED-L2', professor: 'Dra. Patricia Silva', day: 0, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 6,
      name: 'Algoritmos y Estructuras de Datos',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'AED-L1', professor: 'Ing. Martín Gomez', day: 0, startTime: '13:00', endTime: '17:00' },
        { id: 'AED-L2', professor: 'Ing. Lucas Benitez', day: 3, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 7,
      name: 'Arquitectura de Computadoras',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'ACOM-L1', professor: 'Ing. Gonzalo Perez', day: 1, startTime: '13:00', endTime: '17:00' },
        { id: 'ACOM-L2', professor: 'Prof. Walter White', day: 4, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 8,
      name: 'Sistemas y Procesos de Negocio',
      year: 1,
      q: 3,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'SPN-L1', professor: 'Lic. Laura Diaz', day: 2, startTime: '13:00', endTime: '17:00' },
        { id: 'SPN-L2', professor: 'Ing. Andrea Torres', day: 5, startTime: '08:00', endTime: '12:00' }
      ]
    },
    {
      id: 9,
      name: 'Análisis Matemático II',
      year: 2,
      q: 3,
      cursarReqId: [1, 2],
      aprobarReqId: [],
      lessons: [
        { id: 'AM2-L1', professor: 'Dr. Jorge Rossi', day: 0, startTime: '08:00', endTime: '12:00' },
        { id: 'AM2-L2', professor: 'Dra. Maria Fernandez', day: 2, startTime: '18:00', endTime: '22:00' }
      ]
    },
    {
      id: 10,
      name: 'Física II',
      year: 2,
      q: 3,
      cursarReqId: [1, 3],
      aprobarReqId: [],
      lessons: [
        { id: 'FIS2-L1', professor: 'Ing. Carlos Paez', day: 1, startTime: '08:00', endTime: '12:00' },
        { id: 'FIS2-L2', professor: 'Dr. Esteban Quito', day: 3, startTime: '18:00', endTime: '22:00' }
      ]
    }
  ]
};

export const DEFAULT_CAREER_PLANS_MAP = new Map<string, CareerPlan>([
  [AUDIOVISUAL_CAREER_PLAN.id, AUDIOVISUAL_CAREER_PLAN],
  [SISTEMAS_CAREER_PLAN.id, SISTEMAS_CAREER_PLAN]
]);
