/**
 * Fichas de platillo — «Una carta, una historia».
 * Contenido curado para la carta del Hangar 5: cada platillo emblemático
 * tiene su historia, su materia, su maridaje y su momento. El resto recibe
 * el espíritu de su categoría. Clave: slug del nombre del platillo.
 */

export interface FichaHistoria {
  emblema: string; // archivo en /img/fichas/ o /img/
  historia: string;
  ingredientes: string[];
  maridaje: string;
  pideSi: string;
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "y")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ---------- Historias profundas por platillo ---------- */

const PIZZA_BASE = {
  emblema: "fichas/pizza.svg",
  maridaje: "Una cerveza clara fría o un vino tinto joven, según la hora del día.",
};

const HISTORIAS: Record<string, FichaHistoria> = {
  "pizza-margarita": {
    ...PIZZA_BASE,
    historia:
      "La primera pizza fue así de simple y así de perfecta: tomate, queso y albahaca, los tres colores de Italia. La nuestra sale del horno de piedra a más de 400 grados, con la orilla inflada y tostada por dentro, suave por fuera. A 2,800 metros, el aire es más delgado y la masa fermenta distinto — más lento, con más carácter. No es la Margarita de Nápoles: es la del bosque, y tiene personalidad propia.",
    ingredientes: ["Masa madre de fermentación lenta", "Salsa de tomate asado", "Queso mozzarella", "Albahaca fresca de la huerta", "Aceite de oliva", "Sal de grano"],
    pideSi: "Quieres el clásico que nunca falla — el punto de partida para entender nuestro horno.",
  },
  "pizza-peperoni": {
    ...PIZZA_BASE,
    historia:
      "El peperoni se riza en el horno y forma pequeñas copas donde se junta su aceite dorado y picante. Eso es lo que buscas sin saberlo. Debajo, la mozzarella se funde con la salsa de tomate asado y la masa aguanta firme cada mordida. Es la pizza que huele a cabaña, a película en la noche, a 'una más y ya'.",
    ingredientes: ["Masa madre de fermentación lenta", "Salsa de tomate asado", "Queso mozzarella", "Peperoni en copas", "Orégano"],
    pideSi: "Traes antojo de algo directo, dorado y con ese toque picante que pide otra rebanada.",
  },
  "pizza-prosciutto": {
    ...PIZZA_BASE,
    historia:
      "El prosciutto no se hornea: se corona. Sale la pizza del horno con el queso burbujeando y encima caen las láminas finas, que se ablandan con el calor sin perder su textura de seda. Lo salado del jamón contra lo dulce del tomate asado — ese contraste es toda la obra. Es la pizza más elegante de la casa sin pedir permiso.",
    ingredientes: ["Masa madre de fermentación lenta", "Salsa de tomate asado", "Queso mozzarella", "Prosciutto en láminas", "Rúgula fresca", "Aceite de oliva"],
    maridaje: "Una copa de vino tinto y buena conversación. Esta pizza no se come con prisa.",
    pideSi: "Quieres algo especial sin caer en lo complicado — la de las ocasiones que valen la pena.",
  },
  "pizza-champinones": {
    ...PIZZA_BASE,
    historia:
      "De todas nuestras pizzas, esta es la que más sabe a este lugar. Los champiñones se doran primero hasta concentrar todo su sabor a tierra húmeda, a bosque después de la lluvia. En el horno de piedra agarran un ahumado ligero que ningún sartén puede dar. Si el Hangar 5 tuviera que elegir una sola pizza para representarse, probablemente sería esta.",
    ingredientes: ["Masa madre de fermentación lenta", "Salsa de tomate asado", "Queso mozzarella", "Champiñones dorados", "Ajo confitado", "Tomillo"],
    maridaje: "Un mezcal corto o una cerveza oscura — sabores de la misma montaña.",
    pideSi: "Buscas el sabor del bosque en serio: tierra, humo y umami en cada bocado.",
  },
  "pizza-tomate-deshidratado": {
    ...PIZZA_BASE,
    historia:
      "El tomate deshidratado es un truco de paciencia: se seca durante horas hasta que toda el agua se va y queda solamente la esencia — dulce, ácida e intensa, como un tomate que fue al gimnasio. Sobre la mozzarella fundida, cada trozo es una pequeña explosión. La salsa abajo aporta la frescura; los deshidratados, la memoria.",
    ingredientes: ["Masa madre de fermentación lenta", "Salsa de tomate asado", "Queso mozzarella", "Tomate deshidratado", "Albahaca", "Aceite de oliva"],
    pideSi: "Te gusta el tomate de verdad — no el decorativo, sino el que se siente en cada mordida.",
  },
  "pizza-vegetariana": {
    ...PIZZA_BASE,
    historia:
      "La huerta manda en esta pizza. Lo que madura cerca de la cocina termina aquí: verduras asadas al horno de piedra hasta que agarran color y dulzor, sobre la base clásica de tomate y mozzarella. No es la pizza 'de los que no comen carne' — es la pizza de las verduras tratadas con el mismo respeto que la mejor carne.",
    ingredientes: ["Masa madre de fermentación lenta", "Salsa de tomate asado", "Queso mozzarella", "Verduras asadas de temporada", "Aceitunas", "Aceite de oliva"],
    pideSi: "Quieres algo fresco y completo a la vez, o simplemente le tienes fe a la huerta.",
  },
  "pizza-nutela-y-platano": {
    emblema: "fichas/postre.svg",
    historia:
      "La masa del horno no se jubila después de la cena: vuelve al fuego, sale crujiente y tibia, y se cubre de Nutella que se funde con el calor. Encima, ruedas de plátano que se ablandan apenas. Es el final feliz que se pide al centro y desaparece rebanada por rebanada mientras todos dicen 'yo ya no quiero'.",
    ingredientes: ["Masa del horno de piedra", "Nutella tibia", "Plátano en ruedas", "Azúcar glass"],
    maridaje: "Un café americano o un carajillo si la noche apenas empieza.",
    pideSi: "Llegó la hora del postre y quieres algo para compartir — o para no compartir.",
  },
  "hamburguesa-de-wagyu": {
    emblema: "fichas/hamburguesa.svg",
    historia:
      "El wagyu es carne con historia: ganado criado con paciencia, con grasa infiltrada que se derrite a baja temperatura y convierte cada bocado en algo más cercano a la mantequilla que a la carne asada. La sellamos fuerte para que quede costra por fuera y jugosa por dentro, sobre pan que aguanta sin rendirse. No necesita veinte ingredientes: necesita que la trates bien. Es la hamburguesa más seria que vas a comer a 2,800 metros de altura — probablemente a cualquier altura.",
    ingredientes: ["Medallón de wagyu sellado a la parrilla", "Pan artesanal", "Queso fundido", "Lechuga fresca", "Jitomate", "Cebolla", "Aderezo de la casa"],
    maridaje: "Una cerveza oscura o un whisky corto. Esta hamburguesa aguanta maridajes grandes.",
    pideSi: "Vienes con hambre de verdad y quieres el plato fuerte de la casa — el que se te queda grabado.",
  },
  chilaquiles: {
    emblema: "fichas/desayuno.svg",
    historia:
      "El desayuno que México inventó para arreglar cualquier mañana. Totopos que se ablandan justo lo necesario en la salsa — ni sopa, ni secos — con crema, queso y cebolla. En la montaña saben distinto: el frío de la mañana, el vapor del plato, el café al lado. Los chilaquiles no se explican, se desayunan.",
    ingredientes: ["Totopos de maíz", "Salsa de la casa", "Crema", "Queso fresco", "Cebolla", "Cilantro"],
    maridaje: "Café americano recién hecho o un jugo de naranja. La mañana completa.",
    pideSi: "Amaneciste en la montaña y quieres empezar el día como se debe — contundente y caliente.",
  },
  "flan-napolitano": {
    emblema: "fichas/postre.svg",
    historia:
      "El flan es un ejercicio de paciencia: huevo, leche y azúcar que se vuelven seda en baño maría, coronados con un caramelo que se cocinó hasta el punto exacto entre dulce y amargo. Se desmoda frente a ti, tiembla un poco — como debe ser — y la cuchara entra sin resistencia. El postre que las abuelas aprobarían.",
    ingredientes: ["Huevo", "Leche", "Vainilla", "Caramelo"],
    maridaje: "Un café o un carajillo para cerrar la comida como se manda.",
    pideSi: "Quieres el postre de siempre, hecho bien — cremoso, tembloroso y con suficiente caramelo.",
  },
  empanadas: {
    emblema: "fichas/pizza.svg",
    historia:
      "Del mismo horno de piedra que las pizzas salen estas empanadas: masa dorada, crujiente en la orilla y suave en el centro, con relleno caliente que huele apenas la abres. Son el platillo de paso — el que comes con las manos mientras decides qué sigue, o el que te llevas al mirador.",
    ingredientes: ["Masa del horno de piedra", "Relleno del día"],
    maridaje: "Una cerveza clara bien fría o un agua de fruta si es temprano.",
    pideSi: "Quieres algo caliente, dorado y sin formalidad — para empezar o para llevar.",
  },
  taco: {
    emblema: "fichas/hamburguesa.svg",
    historia:
      "La parrilla encendida, la tortilla caliente y el taco que se arma al momento. Aquí no hay adornos innecesarios: el sabor de la brasa es el protagonista y la tortilla apenas lo acompaña. Cómelo recién hecho, con las manos, mirando la montaña — así se entienden los tacos.",
    ingredientes: ["Tortilla de maíz", "Guarnición de la parrilla", "Cebolla", "Cilantro", "Salsa de la casa"],
    maridaje: "Una cerveza clara o un agua de fruta. Lo simple con lo simple.",
    pideSi: "Quieres lo esencial de la parrilla, sin rodeos y al momento.",
  },
  quesadillas: {
    emblema: "fichas/hamburguesa.svg",
    historia:
      "Tortilla de maíz doblada sobre queso que se funde en la parrilla hasta dorar los bordes. Crujiente por fuera, elástica por dentro. El platillo más honesto de la cocina mexicana: dos ingredientes que se entienden perfecto y no necesitan a nadie más.",
    ingredientes: ["Tortilla de maíz", "Queso fundido", "Salsa al gusto"],
    maridaje: "Un agua fresca o un refresco bien frío.",
    pideSi: "Quieres algo caliente, sencillo y reconfortante — el comodín que siempre acierta.",
  },
  cafe: {
    emblema: "fichas/cafe.svg",
    historia:
      "El café de la casa, sin apellidos ni adornos: el que se sirve apenas lo pides y llega humeando a la mesa mientras la niebla todavía baja del Peñón. A esta altura el agua hierve distinto y el café lo sabe — sale más suave, más redondo. Es el compañero oficial de las mañanas del refugio.",
    ingredientes: ["Café de la casa", "Preparado al momento"],
    maridaje: "Un panqué de plátano recién cortado o los chilaquiles de siempre.",
    pideSi: "La mañana de montaña pide su ritual — caliente, simple y sin prisa.",
  },
  "cafe-americano": {
    emblema: "fichas/cafe.svg",
    historia:
      "El americano es el café de las conversaciones largas: taza grande, sabor limpio, suficiente carácter para acompañar sin cansar. Se prepara al momento y aguanta toda la sobremesa — la primera taza sabe a bosque, la segunda a que no hay prisa.",
    ingredientes: ["Doble extracción de café", "Agua caliente", "Taza grande"],
    maridaje: "El desayuno completo: huevos, chilaquiles o fruta de temporada.",
    pideSi: "Vienes a quedarte un rato — a trabajar, leer o simplemente ver la montaña.",
  },
  espresso: {
    emblema: "fichas/cafe.svg",
    historia:
      "Pequeño en tamaño, enorme en intención. El espresso es el concentrado de todo lo que el café puede ser: crema dorada arriba, cuerpo intenso abajo, y un final que se queda contigo un buen rato. Se toma de pie en la barra o sentado sin distracciones — exige atención y la merece.",
    ingredientes: ["Extracción concentrada", "Crema natural"],
    maridaje: "Solo, o con un flan si la tarde lo amerita.",
    pideSi: "Necesitas el golpe de café directo y sin negociación — antes de la caminata o después de comer.",
  },
  latte: {
    emblema: "fichas/cafe.svg",
    historia:
      "El latte es el café que abraza: espresso de base y leche vaporizada hasta quedar sedosa, coronado con su espuma fina. En las mañanas frías del bosque se toma a dos manos, y el vapor que sube de la taza se confunde con la niebla de afuera. Es el favorito de quienes desayunan sin prisa.",
    ingredientes: ["Espresso doble", "Leche vaporizada", "Espuma fina"],
    maridaje: "Un panqué de la casa o el pay de queso — dulzor con dulzor.",
    pideSi: "Hace frío y quieres algo cremoso que se tome despacio, a dos manos.",
  },
  "smoothie-berry": {
    emblema: "fichas/bebida.svg",
    historia:
      "Frutos rojos licuados al momento — moras, frambuesas y lo mejor de la temporada — hasta quedar un color que parece atardecer en vaso. Denso, frío y con esa acidez natural que despierta. Es el smoothie que se pide después de la caminata, cuando el cuerpo pide algo vivo.",
    ingredientes: ["Frutos rojos de temporada", "Base cremosa", "Hielo"],
    maridaje: "Solo está completo — es desayuno ligero y postre a la vez.",
    pideSi: "Vienes de la caminata o del vuelo y quieres algo frío, denso y lleno de vida.",
  },
  "smoothie-banana-con-avena": {
    emblema: "fichas/bebida.svg",
    historia:
      "Plátano maduro y avena: la combinación que los abuelos ya sabían que funcionaba. Cremoso, dulce de forma natural y con suficiente sustancia para aguantar toda la mañana de montaña. Es el combustible favorito de los que van a volar, a pedalear o a caminar hasta el mirador.",
    ingredientes: ["Plátano maduro", "Avena", "Leche", "Toque de canela"],
    maridaje: "Perfecto antes de cualquier actividad — o con la granola de la casa.",
    pideSi: "Tienes día de aventura y necesitas energía real, no solo algo rico.",
  },
};

/** ¿El platillo tiene reseña propia? Solo los estrella de la casa. */
export function tieneHistoria(itemName: string): boolean {
  return slugify(itemName) in HISTORIAS;
}

/** Devuelve la reseña del platillo, o null si no tiene (no se repiten textos). */
export function getHistoria(itemName: string): FichaHistoria | null {
  return HISTORIAS[slugify(itemName)] ?? null;
}
