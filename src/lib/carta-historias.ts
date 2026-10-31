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

/* Los desayunos comparten el mismo ícono; cambian historia e ingredientes. */
const DESAYUNO = {
  emblema: "fichas/desayuno.svg",
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
  "huevos-rancheros": {
    emblema: "fichas/desayuno.svg",
    historia:
      "Los huevos rancheros son la versión más antigua del desayuno del campo: tortilla, huevo, salsa de chile. Nada más. La nuestra lleva la salsa tatemada en el comal hasta que el jitomate se quema apenas en las orillas — ese amargor mínimo es lo que le da profundidad. El huevo va encima, con la yema todavía líquida, y el queso fresco se derrite con el calor de la salsa. Es un plato que sabe a mañana de rancho, aunque estés a 2,800 metros.",
    ingredientes: ["Tortilla de maíz", "Huevos estrellados", "Salsa de jitomate tatemado", "Chile serrano", "Frijoles refritos", "Queso fresco"],
    maridaje: "Café negro o de olla. Un jugo de naranja natural si quieres algo fresco.",
    pideSi: "Te gusta el desayuno con filo — picosito, honesto, sin adornos.",
  },

  "huevos-a-la-mexicana": {
    emblema: "fichas/desayuno.svg",
    historia:
      "Los huevos a la mexicana son la receta más simple de la cocina nacional y también la más difícil de hacer bien: jitomate, cebolla y chile picados fino, sofritos hasta que sueltan su jugo, y el huevo revolcado ahí mismo. El secreto está en no secarlo. El nuestro queda jugoso, con el jitomate todavía entero y el chile dando un calor que no quema. Es el desayuno de todos los días, el que se hace en cinco minutos y sabe a casa.",
    ingredientes: ["Huevos revueltos", "Jitomate picado", "Cebolla", "Chile serrano", "Cilantro", "Aceite de oliva", "Tortillas de maíz"],
    maridaje: "Café americano. Un agua fresca de fruta si es día caluroso.",
    pideSi: "Quieres algo ligero pero con sabor, sin salirte de lo clásico.",
  },

  "huevos-con-jamon": {
    emblema: "fichas/desayuno.svg",
    historia:
      "Hay desayunos que no necesitan historia: el huevo revuelto con jamón es uno de ellos. Es el plato que se pide cuando no quieres pensar, cuando el cuerpo pide proteína y grasa y nada más. En el Hangar lo hacemos con jamón de pierna cortado grueso, no de esos cuadritos industriales — se dora primero en la sartén y luego se mezcla con el huevo, así el sabor se impregna en lugar de quedar aparte.",
    ingredientes: ["Huevos revueltos", "Jamón de pierna en cubos", "Mantequilla", "Cebolla", "Tortillas de maíz", "Frijoles"],
    maridaje: "Café con leche o un latte. Es un desayuno que pide algo cremoso.",
    pideSi: "Quieres un desayuno contundente sin complicaciones, antes de una ruta larga.",
  },

  "huevo-con-champinones": {
    emblema: "fichas/desayuno.svg",
    historia:
      "El champiñón y el huevo se entienden bien: uno aporta tierra y umami, el otro aporta grasa y cuerpo. En el Hangar los salteamos en mantequilla hasta que sueltan el agua y empiezan a dorarse — ese punto es el que importa. Si se sacan antes, saben a agua; si se pasan, saben a amargo. El huevo va encima, revuelto o estrellado, y el pan tostado sirve para limpiar el plato al final.",
    ingredientes: ["Champiñones salteados", "Huevos", "Mantequilla", "Ajo", "Perejil", "Pan tostado"],
    maridaje: "Café negro. Un vino blanco seco si es hora de comida y no de desayuno.",
    pideSi: "Te gusta el sabor del bosque — tierra, humo, setas. Es el mismo espíritu de nuestras pizzas.",
  },

  "fruta-de-temporada": {
    emblema: "fichas/desayuno.svg",
    historia:
      "La fruta de temporada no tiene receta, tiene calendario. Cambia con el año — mangos cuando hay mangos, papaya cuando hay papaya — y por eso nunca sabe igual dos veces. La picamos al momento, la servimos fría y le ponemos chile en polvo y limón, que es como se come en México cuando hace calor. Si pides granola encima, se vuelve un desayuno completo.",
    ingredientes: ["Fruta de temporada picada", "Limón", "Chile en polvo", "Miel de abeja", "Granola de la casa (opcional)"],
    maridaje: "Un agua fresca del día. Un café ligero si prefieres algo tibio.",
    pideSi: "Quieres algo fresco y ligero, o acompañar el desayuno con algo dulce.",
  },

  /* ---------- Ensaladas ---------- */
  "ensalada-caprese": {
    emblema: "fichas/ensalada.svg",
    historia:
      "La Caprese es la ensalada que confía en su materia prima: si el jitomate no es bueno, no hay nada que la salve. Por eso la servimos solo cuando el jitomate está en su punto — carnes firmes, dulzor alto, acidez justa. La mozzarella va fresca, la albahaca se corta en el último momento para que no se oxide, y el aceite de oliva se vierte sin medir. Es la prueba de que tres ingredientes bien elegidos superan a veinte regulares.",
    ingredientes: ["Jitomate de temporada en rodajas", "Mozzarella fresca", "Albahaca fresca", "Aceite de oliva extra virgen", "Sal de grano", "Pimienta negra"],
    maridaje: "Un vino blanco seco o un agua mineral con limón.",
    pideSi: "Quieres algo fresco, ligero y honesto. Ideal para el calor de mediodía.",
  },

  "ensalada-mixta": {
    emblema: "fichas/ensalada.svg",
    historia:
      "La ensalada mixta es la que siempre hay, la que nadie recuerda pero todos comen. Lechuga, jitomate, pepino, zanahoria — lo que esté fresco ese día. La nuestra lleva un aderezo de la casa con aceite de oliva, limón y un toque de mostaza, nada envasado. Es la opción honesta para acompañar una pizza o un corte, y también funciona sola si vienes de la ruta y solo quieres algo verde.",
    ingredientes: ["Lechuga", "Jitomate", "Pepino", "Zanahoria", "Cebolla morada", "Aderezo de limón y mostaza de la casa"],
    maridaje: "Agua mineral o un vino blanco joven.",
    pideSi: "Quieres algo verde y simple para acompañar, sin que compita con el plato principal.",
  },

  "ensalada-tropical": {
    emblema: "fichas/ensalada.svg",
    historia:
      "La ensalada tropical es un poco tramposa: lleva fruta, y la fruta siempre gana el debate del sabor. Mango, piña, jícama, un poco de chile y limón — es una ensalada que se come como se come el mango en la calle, con las manos y sin ceremonia. La servimos fría, con un aderezo ligero de limón y miel, y el contraste entre lo dulce y lo ácido es todo el punto.",
    ingredientes: ["Mango", "Piña", "Jícama", "Pepino", "Chile en polvo", "Limón", "Miel"],
    maridaje: "Un agua fresca de jamaica o un vino blanco dulce.",
    pideSi: "Hace calor y quieres algo dulce, fresco y distinto a la ensalada de siempre.",
  },

  "guacamole": {
    emblema: "fichas/ensalada.svg",
    historia:
      "El guacamole tiene un enemigo: el tiempo. El aguacate se oxida en minutos, así que el nuestro se hace al momento, a mano, con el tenedor — nunca en licuadora, que lo vuelve pasta. Jitomate, cebolla, chile, cilantro, limón y sal. El limón no es solo sabor, es lo que retrasa el oscurecimiento. Si lo pides con totopos, te lo llevamos con totopos hechos ese día.",
    ingredientes: ["Aguacate hass", "Jitomate", "Cebolla", "Chile serrano", "Cilantro", "Limón", "Sal de grano", "Totopos"],
    maridaje: "Una cerveza clara bien fría o una mezcalina.",
    pideSi: "Vas a compartir, o quieres algo para picar mientras esperas el plato fuerte.",
  },

  "verduras-preparadas": {
    emblema: "fichas/ensalada.svg",
    historia:
      "Las verduras preparadas cambian según lo que traiga la huerta esa semana: calabacita, zanahoria, elote, ejote, lo que esté. Las salteamos en aceite de oliva con ajo y sal, apenas lo suficiente para que pierdan el crudo sin volverse blandas. Es un plato que respeta el vegetal en lugar de disfrazarlo, y por eso funciona igual como entrada que como acompañamiento.",
    ingredientes: ["Verduras de temporada", "Aceite de oliva", "Ajo", "Sal de grano", "Pimienta"],
    maridaje: "Un vino blanco seco o un agua mineral.",
    pideSi: "Quieres algo vegetal y ligero, o acompañar un corte de la parrilla.",
  },

  "aceitunas-preparadas": {
    emblema: "fichas/ensalada.svg",
    historia:
      "Las aceitunas no se cocinan, se aliñan. La nuestra lleva aceitunas verdes y negras marinadas en aceite de oliva con ajo, romero y cáscara de limón — reposando desde la mañana para que tomen el sabor. Es el platillo más simple de la carta y también el más antiguo: aceitunas se comen en el Mediterráneo desde antes de que existiera el restaurante. Aquí son el acompañamiento perfecto para una copa de vino.",
    ingredientes: ["Aceitunas verdes", "Aceitunas negras", "Aceite de oliva", "Ajo", "Romero", "Cáscara de limón"],
    maridaje: "Copa de vino tinto o un mezcal reposado.",
    pideSi: "Vas a tomar algo y quieres picar sin pedir un plato completo.",
  },

  /* ---------- Parrilla ---------- */
  "flautas": {
    emblema: "fichas/parrilla.svg",
    historia:
      "Las flautas son tacos que decidieron volverse crujientes: tortilla enrollada con relleno y frita hasta que todo el exterior queda dorado y quebradizo. La nuestra lleva pollo deshebrado y se sirve sobre lechuga, con crema, queso fresco y salsa verde encima — la combinación de lo crujiente con lo fresco es lo que hace que no empalaguen. Son de esas cosas que se piden para compartir y terminan comiéndose uno solo.",
    ingredientes: ["Tortilla de maíz frita", "Pollo deshebrado", "Lechuga", "Crema", "Queso fresco", "Salsa verde"],
    maridaje: "Agua fresca o cerveza clara.",
    pideSi: "Quieres algo crujiente para compartir como entrada.",
  },

  "sandwich": {
    emblema: "fichas/parrilla.svg",
    historia:
      "El sándwich del Hangar no intenta ser un club sándwich de hotel: es pan, proteína y algo fresco para que no se sienta pesado. Lo armamos con pan que se tuesta en la plancha con mantequilla por dentro, para que no se humedezca, y lo servimos con papas o ensalada. Es el plato que pides cuando quieres comer rápido antes de una actividad, sin quedarte con hambre a medio camino.",
    ingredientes: ["Pan tostado en mantequilla", "Proteína a elegir", "Lechuga", "Jitomate", "Queso", "Aderezo de la casa"],
    maridaje: "Agua fresca o cerveza clara.",
    pideSi: "Tienes prisa y necesitas algo completo pero ligero.",
  },

  /* ---------- Postres ---------- */
  "pay-de-queso": {
    emblema: "fichas/postre.svg",
    historia:
      "El pay de queso es el postre que no falla: base de galleta triturada, relleno de queso crema batido con huevo y un poco de vainilla, horneado hasta que el centro queda firme pero todavía tembloroso. La clave está en no pasarlo de horno — un pay de queso seco es un pay de queso arruinado. El nuestro se enfría despacio y se sirve frío, con la superficie apenas dorada.",
    ingredientes: ["Base de galleta", "Queso crema", "Huevo", "Vainilla", "Azúcar", "Mantequilla"],
    maridaje: "Café americano o un café de olla. Un vino dulce si quieres cerrar con algo especial.",
    pideSi: "Quieres el postre clásico, el que a todos les gusta y nadie rechaza.",
  },

  "panque": {
    emblema: "fichas/postre.svg",
    historia:
      "El panqué es el postre de la casa: masa batida, mantequilla, vainilla y huevo, horneado en molde hasta que el centro queda húmedo y el borde dorado. No lleva glaseado ni adornos — se sostiene solo. Lo cortamos en rebanadas gruesas y lo servimos a temperatura ambiente, cuando el sabor ya se asentó y la miga está tierna.",
    ingredientes: ["Harina", "Mantequilla", "Huevo", "Azúcar", "Vainilla", "Polvo para hornear"],
    maridaje: "Café negro o un té negro. Un vaso de leche si quieres algo sencillo.",
    pideSi: "Quieres algo casero y sencillo para acompañar el café.",
  },

  "panque-de-platano": {
    emblema: "fichas/postre.svg",
    historia:
      "El panqué de plátano es el panqué que nació para no desperdiciar: cuando el plátano se pasa de maduro y se pone negro, es justo cuando más dulce está y mejor funciona en el horno. La pulpa se machaca y se mezcla con la masa, y el resultado es un panqué húmedo, denso, con un dulzor que no necesita azúcar extra. Es el postre más honesto de la carta.",
    ingredientes: ["Plátano maduro", "Harina", "Mantequilla", "Huevo", "Azúcar morena", "Nuez (opcional)"],
    maridaje: "Café con leche o un latte. Un té chai si quieres algo especiado.",
    pideSi: "Te gusta lo húmedo y dulce. También es el favorito de los niños.",
  },

  "panque-de-queso": {
    emblema: "fichas/postre.svg",
    historia:
      "El panqué de queso es la versión salada-dulce del panqué clásico: se le suma queso crema a la masa, y eso lo vuelve más húmedo y con un sabor ligeramente ácido que equilibra el dulzor. Es un postre que divide opiniones — a quien le gusta el queso, le encanta; a quien no, lo encuentra raro. En el Hangar lo servimos tibio, cuando el queso todavía está suave.",
    ingredientes: ["Harina", "Queso crema", "Mantequilla", "Huevo", "Azúcar", "Vainilla"],
    maridaje: "Café americano. Un vino blanco dulce si quieres algo distinto.",
    pideSi: "Te gustan los postres con contraste — dulce y salado en el mismo bocado.",
  },

  /* ---------- Bebidas con historia ---------- */
  "carajillo": {
    emblema: "fichas/bebida.svg",
    historia:
      "El carajillo es el café que se volvió trago: espresso caliente con un chorro de Licor 43, servido en vaso pequeño y bebido de un trago. Nació en España como una forma de espantar el sueño en el trabajo, y llegó a México para quedarse. El nuestro lleva el café cargado y el licor en la proporción justa — dulce pero sin dejar de saber a café.",
    ingredientes: ["Espresso", "Licor 43", "Hielo (opcional)", "Piel de naranja"],
    maridaje: "Solo. Es un trago de sobremesa, no de acompañamiento.",
    pideSi: "Es tarde, quieres un último café, y ya estás de humor para algo más fuerte.",
  },

  "margarita": {
    emblema: "fichas/bebida.svg",
    historia:
      "La margarita es el cóctel mexicano por excelencia, aunque nadie se pone de acuerdo en quién la inventó. Tequila, licor de naranja y limón — esa es la fórmula. La nuestra va en vaso con escarcha de sal en el borde, no en copa de martini, y con limón exprimido al momento en lugar de mezcla preparada. La diferencia se nota en el primer sorbo.",
    ingredientes: ["Tequila blanco", "Licor de naranja", "Jugo de limón fresco", "Escarcha de sal", "Hielo"],
    maridaje: "Sola, bien fría, con un plato de la parrilla.",
    pideSi: "Quieres el cóctel clásico, el que todos conocen y nadie rechaza.",
  },

  "mojito": {
    emblema: "fichas/bebida.svg",
    historia:
      "El mojito es cubano, pero se siente caribeño en todos lados: ron blanco, hierbabuena, limón, azúcar y agua con gas. Lo importante es no machacar la hierbabuena hasta deshacerla — se aprieta apenas para que suelte el aceite y no el amargor de la hoja. El nuestro va en vaso alto, con hielo abundante y una rama de hierbabuena arriba.",
    ingredientes: ["Ron blanco", "Hierbabuena fresca", "Jugo de limón", "Azúcar", "Agua mineral", "Hielo"],
    maridaje: "Solo. Es un trago refrescante para el calor de la tarde.",
    pideSi: "Hace calor y quieres algo fresco, con hierbabuena de verdad.",
  },

  "paloma-tequila": {
    emblema: "fichas/bebida.svg",
    historia:
      "La paloma es más mexicana que la margarita, aunque casi nadie fuera del país la conozca: tequila blanco, jugo de toronja, limón y sal. Nació en las cantinas del centro de México como una forma de hacer rendir el tequila, y se volvió la bebida de las tardes largas. La nuestra lleva jugo de toronja natural, no refresco, y eso la hace menos dulce y más cítrica.",
    ingredientes: ["Tequila blanco", "Jugo de toronja natural", "Jugo de limón", "Sal", "Agua mineral", "Hielo"],
    maridaje: "Sola, con botanas saladas.",
    pideSi: "Quieres un trago refrescante y cítrico, menos dulce que una margarita.",
  },

  "mezcalina": {
    emblema: "fichas/bebida.svg",
    historia:
      "La mezcalina es la versión de la michelada hecha con mezcal: cerveza, jugo de limón, sal, y el humo del mezcal encima. Es un trago que divide — a quien le gusta el mezcal, le parece la mejor michelada del mundo; a quien no, le parece demasiado. En el Hangar la servimos con mezcal espadín joven, para que el humo no se pierda entre la cerveza.",
    ingredientes: ["Mezcal espadín", "Cerveza clara", "Jugo de limón", "Sal", "Hielo", "Chamoy (opcional)"],
    maridaje: "Sola. Es un trago con carácter propio.",
    pideSi: "Te gusta el mezcal y quieres algo refrescante que no lo esconda.",
  },

  "pina-colada": {
    emblema: "fichas/bebida.svg",
    historia:
      "La piña colada es la bebida que huele a vacaciones: piña, crema de coco y hielo, todo licuado hasta quedar espeso. Nació en Puerto Rico en los años cincuenta y desde entonces es el trago que piden quienes quieren sentirse en la playa, aunque estén a 2,800 metros entre pinos. La nuestra lleva piña natural licuada, no jugo envasado.",
    ingredientes: ["Piña natural", "Crema de coco", "Hielo", "Leche condensada (opcional)", "Sombrilla de piña"],
    maridaje: "Sola, con algo salado para equilibrar el dulzor.",
    pideSi: "Quieres algo dulce, frío y sin alcohol.",
  },

  "pina-colada-con-alcohol": {
    emblema: "fichas/bebida.svg",
    historia:
      "La misma piña colada, con ron blanco encima. El alcohol no cambia mucho el sabor — cambia la sensación: deja de ser un postre líquido y se vuelve un trago de tarde. En el Hangar la servimos bien fría, con hielo abundante, y la piña natural mantiene el dulzor sin necesidad de azúcar añadida. Es la bebida que pides cuando el día de vuelo terminó bien.",
    ingredientes: ["Ron blanco", "Piña natural", "Crema de coco", "Hielo", "Leche condensada (opcional)"],
    maridaje: "Sola. Es un trago de tarde, para beber despacio.",
    pideSi: "Ya aterrizaste, el día salió bien, y quieres celebrar con algo dulce.",
  },

  "clamato": {
    emblema: "fichas/bebida.svg",
    historia:
      "El Clamato es un invento mexicano, aunque suene a otra cosa: jugo de tomate con almeja, condimentado, servido con cerveza en la michelada o solo, con limón y sal. Es un trago salado, no dulce, y por eso funciona mejor de lo que suena — el tomate y el marisco dan un sabor profundo que corta la sed de verdad. Lo servimos en vaso con hielo, limón y un escarchado ligero de sal y chile.",
    ingredientes: ["Clamato", "Jugo de limón", "Sal", "Chile en polvo", "Hielo", "Cerveza (opcional)"],
    maridaje: "Solo o con cerveza clara. Con mariscos o algo salado.",
    pideSi: "Quieres algo salado y refrescante en lugar de dulce.",
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
