export const translations = {
    es: {
        // Header
        title: 'WarEra Market Analytics',
        subtitle: 'Análisis de mercado y optimización de producción en tiempo real',
        lastUpdate: 'Actualizado',
        nextUpdate: 'Próxima actualización en',

        // Navigation
        navHome: 'Monitor de Mercado',
        navProduction: 'Guía de Producción',
        navMarket: 'Precios de Mercado',
        navPlayground: 'Playground',

        // Playground
        playground: {
            title: 'Área de Pruebas',
            subtitle: 'Función experimental: Gestor Interactivo de Empresas',
            refresh: 'Actualizar Datos',
            loading: 'Cargando...',
            error: 'Error al cargar datos',
            noData: 'No hay cadenas de producción activas.',
            flow: {
                title: 'Flujo de Recursos',
                production: 'Producción',
                consumption: 'Consumo',
                surplus: 'Superávit',
                deficit: 'Déficit',
                balanced: 'Equilibrado',
                netFlow: 'Flujo Neto',
                activeCompanies: 'Empresas Activas'
            },
            card: {
                yield: 'Prod. Diaria',
                revenue: 'Ingresos',
                wages: 'Salarios',
                inputs: 'Materiales',
                net: 'Neto Diario',
                employees: 'Empleados',
                bonus: 'Bono Producción',
                unknown: 'Producto Desconocido',
                noRecipe: 'Receta no encontrada',
                engine: 'Motor',
                storage: 'Alm.',
                maxWage: 'Salario Máx. Sust.',
                stock: 'Stock (Items)',
                full: 'Lleno',
                time: 'Tiempo'
            },
            employee: {
                title: 'EMPLEADOS',
                energy: 'ENERGÍA',
                prod: 'PROD',
                wage: 'SALARIO',
                fidelity: 'FID%',
                add: 'Añadir'
            },
            general: {
                units: 'unidades',
                currency: 'G'
            }
        },

        // Market Page
        marketTitle: 'Precios de Mercado',
        marketSubtitle: 'Precios actuales en tiempo real de todos los recursos',
        lastPriceUpdate: 'Última actualización de precio',
        trend: 'Tendencia',
        priceHistory: 'Historial de Precios',
        currentPrice: 'Precio Actual',
        volume: 'Volumen',
        estimatedVolume: 'Volumen (Est)',
        details: 'Detalles',
        searchPlaceholder: 'Buscar recurso...',
        refresh: 'Actualizar',

        // Production Page
        productionTitle: 'Guía de Producción',
        productionSubtitle: 'Recetas de crafteo, costes de recursos y puntos de trabajo',
        inputs: 'Recursos Necesarios',
        baseProduction: 'Producción Base',
        workPointsAbbr: 'PT',

        // Disclaimer
        disclaimerTitle: 'ℹ️ Aviso Importante',
        disclaimerMessage: 'La actualización automática de precios puede fallar ocasionalmente cuando el token de autenticación necesita renovarse. Si los precios no se actualizan, puedes usar los **Precios Manuales** mientras se soluciona el problema.',

        // Strategy Box
        strategyTitle: '💡 Tip: ¿Produces tus propios materiales?',
        strategyMessage: 'Si tú mismo cultivas el Grano o minas el Hierro, ¡no tienes que comprarlos en el mercado! Pon su precio manual a 0 para ver tu beneficio "limpio". Por defecto, la herramienta siempre elige el camino más barato: si el mercado vende el material base por debajo de tu coste de mano de obra, usará ese precio para calcular tu coste final.',

        // Help Modal
        helpTitle: '📖 ¿Cómo entender el Ranking?',
        helpRule1Title: '🏮 La Regla del "Menos Malo"',
        helpRule1Text: 'El ranking siempre pone arriba el mejor resultado. Si todo el mercado está en rojo, el primero es simplemente el que menos dinero te hace perder.',
        helpRule2Title: '🧠 La Compra Inteligente',
        helpRule2Text: 'La app detecta si es más barato comprar ingredientes o fabricarlos. Si el petróleo está muy barato, calculará el coste del aceite usándolo como base.',
        helpRule3Title: '🛑 Columna "Oportunidad"',
        helpRule3Text: 'Si dice "COMPRAR", el mercado vende el producto más barato de lo que te cuesta a ti fabricarlo. ¡No trabajes a pérdida!',
        close: 'Cerrar',

        // Stats Card
        profitableProducts: 'Productos Rentables',
        bestOption: 'Mejor Opción',
        worstOption: 'Menos Rentable',

        // Actions
        updatePrices: 'Actualizar Precios',
        updating: 'Actualizando...',
        refreshButton: 'Actualizar', // Testing
        exportCSV: 'Exportar CSV',
        exportPDF: 'Exportar PDF',

        // Table
        rankingTitle: 'Ranking de Rentabilidad',
        rankingSubtitle: 'Ordenado por beneficio neto (de mayor a menor)',
        rank: '#',
        product: 'Producto',
        marketPrice: 'Precio Mercado',
        productionCost: 'Coste Producción',
        netProfit: 'Beneficio Neto',
        profitMargin: 'Margen %',
        loss: 'Pérdida',
        profitableSummary: 'productos rentables de',
        analyzed: 'analizados',
        opportunity: 'Oportunidad',
        produce: 'PRODUCIR',
        buy: 'COMPRAR',
        neutral: 'Neutro',

        // Tooltips
        tooltips: {
            rank: 'Posición basada en el beneficio neto por hora',
            product: 'Nombre del ítem manufacturado',
            marketPrice: 'Precio de venta actual en el mercado',
            productionCost: 'Coste estimado (Salario + Materiales)',
            netProfit: 'Beneficio neto al vender una unidad',
            profitMargin: 'Porcentaje de retorno sobre la inversión',
            opportunity: 'Si es más rentable fabricarlo o comprarlo'
        },

        // Item Descriptions (Keys match recipe IDs)
        itemDescriptions: {
            'bread': 'Restaura 10 Salud. Consume 1 Hambre. Alimento básico.',
            'grain': 'Materia prima agrícola usada para hacer Pan.',
            'lightAmmo': 'Munición. Aumenta Ataque un 10%. Esencial para combate básico.',
            'ammo': 'Munición estándar. Aumenta Ataque un 20%. Potencia equilibrada.',
            'heavyAmmo': 'Munición pesada. Gran aumento de Ataque. Para soldados de élite.',
            'lead': 'Plomo. Metal pesado esencial para fabricar munición.',
            'livestock': 'Ganado criado para producir Bistec.',
            'steak': 'Restaura 20 Salud. Consume 1 Hambre. Eficiente para batallas.',
            'fish': 'Recurso de pesca. Cocínalo para mayor eficiencia.',
            'cookedFish': 'Restaura 30 Salud. Consume 1 Hambre. Máxima eficiencia en guerras largas.',
            'limestone': 'Piedra Caliza. Se tritura para producir Concreto.',
            'concrete': 'Material. 300 para Unidad Militar. 5 para Mover Compañía.',
            'iron': 'Mineral de hierro. Se funde en Acero.',
            'steel': 'Aleación refinada. Mejora Edificios, Almacenes y Motores.',
            'petroleum': 'Combustible fósil. Se refina en Aceite.',
            'oil': 'Aceite refinado. Combustible para operaciones industriales.',
            'coca': 'Planta misteriosa. Ingrediente base para estimulantes.',
            'cocain': 'Píldora de Combate. Consume Hambre para dar un Buff de Daño temporal.',
            'default': 'Material procesado o recurso básico de WarEra.'
        },

        // Item Names
        itemNames: {
            'lead': 'Plomo',
            'lightAmmo': 'Muni. Ligera',
            'ammo': 'Munición',
            'heavyAmmo': 'Muni. Pesada',
            'grain': 'Grano',
            'bread': 'Pan',
            'livestock': 'Ganado',
            'steak': 'Bistec',
            'fish': 'Pescado',
            'cookedFish': 'Pesc. Cocido',
            'limestone': 'P. Caliza',
            'concrete': 'Concreto',
            'iron': 'Hierro',
            'steel': 'Acero',
            'petroleum': 'Petróleo',
            'oil': 'Aceite',
            'coca': 'Planta Mist.',
            'cocain': 'Píldora'
        },

        // Calculator
        calculatorTitle: 'Calculadora de Beneficios',
        salaryPerWorkPoint: 'Salario por Punto de Trabajo',
        selectProduct: 'Seleccionar producto',
        workPoints: 'Puntos de Trabajo',
        laborCost: 'Coste de Mano de Obra',
        materialsCost: 'Coste de Materiales',
        totalCost: 'Coste Total',
        selling: 'Vendiendo a',
        profit: 'Beneficio',

        // Manual Prices
        manualPricesTitle: 'Precios Manuales',
        manualPricesSubtitle: 'Sobrescribe precios del mercado con tus propios valores',
        resetAll: 'Restablecer Todo',
        automatic: 'Automático',
        manual: 'Manual',

        // Errors
        tokenExpired: 'Sesión expirada. Usando últimos datos guardados o modo manual.',
        noData: 'No hay datos disponibles',

        // Footer
        footerDonation: 'Si esta herramienta te resulta útil',
        footerDonationLink: 'visita mi perfil',
        footerMessage: 'y considera apoyarme in-game. Hecho con ❤️ para ayudar a la comunidad de WarEra',
    },
    en: {
        // Header
        title: 'WarEra Market Analytics',
        subtitle: 'Real-time market analysis and production optimization',
        lastUpdate: 'Updated',
        nextUpdate: 'Next update in',

        // Navigation
        navHome: 'Market Monitor',
        navProduction: 'Production Guide',
        navMarket: 'Market Prices',
        navPlayground: 'Playground',

        // Playground
        playground: {
            title: 'Playground',
            subtitle: 'Experimental feature: Interactive Company Manager',
            refresh: 'Refresh Data',
            loading: 'Loading...',
            error: 'Failed to load data',
            noData: 'No active production chains.',
            flow: {
                title: 'Resource Flow',
                production: 'Production',
                consumption: 'Consumption',
                surplus: 'Surplus',
                deficit: 'Deficit',
                balanced: 'Balanced',
                netFlow: 'Net Flow',
                activeCompanies: 'Active Companies'
            },
            card: {
                yield: 'Daily Yield',
                revenue: 'Revenue',
                wages: 'Wages',
                inputs: 'Inputs',
                net: 'Daily Net',
                employees: 'Employees',
                bonus: 'Production Bonus',
                unknown: 'Unknown Product',
                noRecipe: 'No Recipe Found',
                engine: 'Engine',
                storage: 'Stor.',
                maxWage: 'Max Sust. Wage',
                stock: 'Storage (Items)',
                full: 'Full',
                time: 'Time'
            },
            employee: {
                title: 'EMPLOYEES',
                energy: 'ENERGY',
                prod: 'PROD',
                wage: 'WAGE',
                fidelity: 'FID%',
                add: 'Add'
            },
            general: {
                units: 'units',
                currency: 'G'
            }
        },

        // Market Page
        marketTitle: 'Market Prices',
        marketSubtitle: 'Real-time market prices for all resources',
        lastPriceUpdate: 'Last price update',
        trend: 'Trend',
        priceHistory: 'Price History',
        currentPrice: 'Current Price',
        volume: 'Volume',
        estimatedVolume: 'Volume (Est)',
        details: 'Details',
        searchPlaceholder: 'Search resource...',
        refresh: 'Refresh',

        // Production Page
        productionTitle: 'Production Guide',
        productionSubtitle: 'Crafting recipes, resource costs, and work points',
        inputs: 'Required Resources',
        baseProduction: 'Base Production',
        workPointsAbbr: 'WP',

        // Disclaimer
        disclaimerTitle: 'ℹ️ Important Notice',
        disclaimerMessage: 'Automatic price updates may occasionally fail when the authentication token needs renewal. If prices don\'t update, you can use **Manual Prices** while the issue is resolved.',

        // Strategy Box
        strategyTitle: '💡 Tip: Do you produce your own materials?',
        strategyMessage: 'If you grow your own Grain or mine your own Iron, you don\'t have to buy them! Set their manual price to 0 to see your "clean" profit. By default, the tool always picks the cheapest path: if the market sells base materials below your labor cost, it will use that price to calculate your final cost.',

        // Help Modal
        helpTitle: '📖 How to read the Ranking?',
        helpRule1Title: '🏮 The "Least Bad" Rule',
        helpRule1Text: 'The ranking always puts the best result at the top. If the entire market is in the red, the first one is simply the one that loses you the least amount of money.',
        helpRule2Title: '🧠 Smart Buy Logic',
        helpRule2Text: 'The app detects if it is cheaper to buy ingredients or craft them. If petroleum is very cheap, it will use its market price to calculate the cost of oil.',
        helpRule3Title: '🛑 "Opportunity" Column',
        helpRule3Text: 'If it says "BUY", the market is selling the product cheaper than it costs you to make it. Do not work for a loss!',
        close: 'Close',

        // Stats Cards
        profitableProducts: 'Profitable Products',
        bestOption: 'Best Option',
        worstOption: 'Least Profitable',

        // Actions
        updatePrices: 'Update Prices',
        updating: 'Updating...',
        refreshButton: 'Refresh', // Testing
        exportCSV: 'Export CSV',
        exportPDF: 'Export PDF',

        // Table
        rankingTitle: 'Profitability Ranking',
        rankingSubtitle: 'Sorted by net profit (highest to lowest)',
        rank: '#',
        product: 'Product',
        marketPrice: 'Market Price',
        productionCost: 'Production Cost',
        netProfit: 'Net Profit',
        profitMargin: 'Margin %',
        loss: 'Loss',
        profitableSummary: 'profitable products out of',
        analyzed: 'analyzed',
        opportunity: 'Opportunity',
        produce: 'PRODUCE',
        buy: 'BUY',
        neutral: 'Neutral',

        // Tooltips
        tooltips: {
            rank: 'Rank based on net profit per hour',
            product: 'Name of the manufactured item',
            marketPrice: 'Current selling price in the market',
            productionCost: 'Estimated cost (Salary + Materials)',
            netProfit: 'Net profit when selling one unit',
            profitMargin: 'Return on investment percentage',
            opportunity: 'Whether it is better to produce or buy'
        },

        // Item Descriptions
        itemDescriptions: {
            'bread': 'Restores 10 Health. Consumes 1 Hunger. Basic food for survival.',
            'grain': 'Agricultural raw material processed into Bread.',
            'lightAmmo': 'Ammunition. Increases Attack by 10%. Essential for basic combat.',
            'ammo': 'Standard ammunition. Increases Attack by 20%. Balanced firepower.',
            'heavyAmmo': 'Heavy ammunition. Significantly increases Attack. For elite soldiers.',
            'lead': 'Heavy metal. The primary component for crafting all ammunition types.',
            'livestock': 'Farm animals raised to produce Steak.',
            'steak': 'Restores 20 Health. Consumes 1 Hunger. Efficient food for sustaining battles.',
            'fish': 'Raw fish. Can be cooked for better efficiency.',
            'cookedFish': 'Restores 30 Health. Consumes 1 Hunger. Max efficiency for long battles.',
            'limestone': 'Sedimentary rock. Crushed to produce Concrete.',
            'concrete': 'Construction material. 300 required for a Military Unit. 5 to move Company.',
            'iron': 'Base metal ore. Smelted into Steel for heavy industry.',
            'steel': 'Refined alloy. Used to upgrade Buildings, Storage, and Engines.',
            'petroleum': 'Fossil fuel. Refined into Oil.',
            'oil': 'Refined Oil. Fuel for maintaining industrial operations.',
            'coca': 'Mysterious plant. Base ingredient for stimulant Pills.',
            'cocain': 'Combat Pill. Consumes Hunger to provide a temporary Damage Buff.',
            'default': 'Processed material or basic resource of WarEra.'
        },

        // Item Names
        itemNames: {
            'lead': 'Lead',
            'lightAmmo': 'Light Ammo',
            'ammo': 'Ammunition',
            'heavyAmmo': 'Heavy Ammo',
            'grain': 'Grain',
            'bread': 'Bread',
            'livestock': 'Livestock',
            'steak': 'Steak',
            'fish': 'Fish',
            'cookedFish': 'Cooked Fish',
            'limestone': 'Limestone',
            'concrete': 'Concrete',
            'iron': 'Iron',
            'steel': 'Steel',
            'petroleum': 'Petroleum',
            'oil': 'Oil',
            'coca': 'Myst. Plant',
            'cocain': 'Pill'
        },

        // Calculator
        calculatorTitle: 'Profit Calculator',
        salaryPerWorkPoint: 'Salary per Work Point',
        selectProduct: 'Select product',
        workPoints: 'Work Points',
        laborCost: 'Labor Cost',
        materialsCost: 'Materials Cost',
        totalCost: 'Total Cost',
        selling: 'Selling at',
        profit: 'Profit',

        // Manual Prices
        manualPricesTitle: 'Manual Prices',
        manualPricesSubtitle: 'Override market prices with your own values',
        resetAll: 'Reset All',
        automatic: 'Automatic',
        manual: 'Manual',

        // Errors
        tokenExpired: 'Session expired. Using last saved data or manual mode.',
        noData: 'No data available',

        // Footer
        footerDonation: 'If you find this tool useful',
        footerDonationLink: 'visit my profile',
        footerMessage: 'and consider supporting me in-game. Made with ❤️ to help the WarEra community',
    },
};

export type Language = 'es' | 'en';
export type TranslationKey = keyof typeof translations.es;
