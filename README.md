# IP-SH
Actividad 4.1 Aplicar conocimientos en ejercicio practico de JS

Es una pequeña aplicación web que muestra en un mapa la ubicación aproximada de una dirección IP o dominio. Al cargar la página, obtiene automáticamente la IP pública del visitante y la ubica en el mapa; además permite buscar cualquier otra IP o dominio y ver su información (ciudad, región, país, código postal, zona horaria e ISP).

## Funcionalidades
 
-  Detección automática de la IP del visitante al cargar la página
-  Búsqueda de cualquier IP o dominio, con validación por regex
-  Botón para volver a la ubicación del dispositivo
-  Modo claro / oscuro (respeta la preferencia del sistema y se guarda en `localStorage`)
-  Loader animado mientras se resuelve la petición