# Banco de dados local de aeronaves brasileiras
# Baseado em dados públicos da ANAC - Registro Aeronáutico Brasileiro (RAB)
# Este banco contém matrículas comuns e pode ser expandido

# Prefixos de companhias aéreas brasileiras
AIRLINE_PREFIXES = {
    "PR-": "Brasil (Particular/Comercial)",
    "PP-": "Brasil (Particular/Comercial - Série Antiga)",
    "PT-": "Brasil (Táxi Aéreo/Experimental)",
    "PS-": "Brasil (Serviços Aéreos Especializados)",
    "PU-": "Brasil (Ultraleve)",
}

# Principais operadores brasileiros e seus prefixos típicos
KNOWN_OPERATORS = {
    # LATAM
    "PR-XA": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XB": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XC": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XD": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XE": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XF": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XG": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XH": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XI": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XJ": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XK": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XL": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XM": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XN": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XO": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XP": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XQ": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XR": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XS": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XT": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XV": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    "PR-XY": {"operator": "LATAM Airlines Brasil", "type": "Airbus"},
    
    # GOL
    "PR-G": {"operator": "GOL Linhas Aéreas", "type": "Boeing"},
    "PR-GO": {"operator": "GOL Linhas Aéreas", "type": "Boeing"},
    "PR-GU": {"operator": "GOL Linhas Aéreas", "type": "Boeing"},
    "PR-GX": {"operator": "GOL Linhas Aéreas", "type": "Boeing"},
    "PR-GY": {"operator": "GOL Linhas Aéreas", "type": "Boeing"},
    "PR-GZ": {"operator": "GOL Linhas Aéreas", "type": "Boeing"},
    "PR-VB": {"operator": "GOL Linhas Aéreas", "type": "Boeing"},
    
    # Azul
    "PR-A": {"operator": "Azul Linhas Aéreas", "type": "Mixed"},
    "PR-AJ": {"operator": "Azul Linhas Aéreas", "type": "Airbus"},
    "PR-AX": {"operator": "Azul Linhas Aéreas", "type": "Airbus"},
    "PR-AY": {"operator": "Azul Linhas Aéreas", "type": "Airbus"},
    "PR-AZ": {"operator": "Azul Linhas Aéreas", "type": "Mixed"},
    "PR-YR": {"operator": "Azul Linhas Aéreas", "type": "Airbus"},
    "PR-YS": {"operator": "Azul Linhas Aéreas", "type": "Airbus"},
    "PR-YY": {"operator": "Azul Linhas Aéreas", "type": "Embraer"},
    
    # VOEPASS (antiga Passaredo)
    "PR-PD": {"operator": "VOEPASS", "type": "ATR"},
    "PS-VP": {"operator": "VOEPASS", "type": "ATR"},
    
    # Aviação Executiva
    "PR-EM": {"operator": "Embraer Executive Jets", "type": "Embraer"},
    "PR-PH": {"operator": "Phenom/Embraer", "type": "Embraer"},
    "PR-LJ": {"operator": "Legacy Jet", "type": "Embraer"},
    
    # MAP Linhas Aéreas
    "PR-MA": {"operator": "MAP Linhas Aéreas", "type": "Cessna"},
    
    # Itapemirim (encerrou operações)
    "PR-IT": {"operator": "Itapemirim (Encerrada)", "type": "Airbus"},
    
    # FAB - Força Aérea Brasileira
    "FAB": {"operator": "Força Aérea Brasileira", "type": "Militar"},
    "VC-": {"operator": "Força Aérea Brasileira (VIP)", "type": "Militar"},
    
    # Abaeté
    "PR-AB": {"operator": "Abaeté Linhas Aéreas", "type": "Cessna"},
    
    # Gol Cargo
    "PR-GC": {"operator": "GOL Cargo", "type": "Boeing"},
    
    # Two Flex
    "PR-TW": {"operator": "Two Flex", "type": "Cessna"},
    
    # Sideral
    "PR-SD": {"operator": "Sideral Linhas Aéreas", "type": "Boeing"},
}

# Modelos de aeronaves comuns no Brasil
AIRCRAFT_MODELS = {
    # Airbus
    "A318": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A318"},
    "A319": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A319"},
    "A320": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A320"},
    "A320neo": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A320neo"},
    "A321": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A321"},
    "A321neo": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A321neo"},
    "A330": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A330"},
    "A330neo": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A330neo"},
    "A350": {"manufacturer": "Airbus", "type": "Airbus", "full_name": "Airbus A350"},
    
    # Boeing
    "737": {"manufacturer": "Boeing", "type": "Boeing", "full_name": "Boeing 737"},
    "737-700": {"manufacturer": "Boeing", "type": "Boeing", "full_name": "Boeing 737-700"},
    "737-800": {"manufacturer": "Boeing", "type": "Boeing", "full_name": "Boeing 737-800"},
    "737 MAX 8": {"manufacturer": "Boeing", "type": "Boeing", "full_name": "Boeing 737 MAX 8"},
    "767": {"manufacturer": "Boeing", "type": "Boeing", "full_name": "Boeing 767"},
    "777": {"manufacturer": "Boeing", "type": "Boeing", "full_name": "Boeing 777"},
    "787": {"manufacturer": "Boeing", "type": "Boeing", "full_name": "Boeing 787 Dreamliner"},
    
    # Embraer
    "E170": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer E170"},
    "E175": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer E175"},
    "E190": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer E190"},
    "E195": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer E195"},
    "E195-E2": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer E195-E2"},
    "ERJ145": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer ERJ-145"},
    "Phenom 100": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer Phenom 100"},
    "Phenom 300": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer Phenom 300"},
    "Legacy 450": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer Legacy 450"},
    "Legacy 500": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer Legacy 500"},
    "Legacy 600": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer Legacy 600"},
    "Praetor 500": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer Praetor 500"},
    "Praetor 600": {"manufacturer": "Embraer", "type": "Embraer", "full_name": "Embraer Praetor 600"},
    
    # ATR
    "ATR 42": {"manufacturer": "ATR", "type": "ATR", "full_name": "ATR 42"},
    "ATR 72": {"manufacturer": "ATR", "type": "ATR", "full_name": "ATR 72"},
    
    # Cessna
    "Cessna 208": {"manufacturer": "Cessna", "type": "Aviação Geral", "full_name": "Cessna 208 Caravan"},
    "Cessna 172": {"manufacturer": "Cessna", "type": "Aviação Geral", "full_name": "Cessna 172 Skyhawk"},
    "Cessna Citation": {"manufacturer": "Cessna", "type": "Aviação Geral", "full_name": "Cessna Citation"},
    
    # Piper
    "PA-28": {"manufacturer": "Piper", "type": "Aviação Geral", "full_name": "Piper PA-28 Cherokee"},
    "PA-34": {"manufacturer": "Piper", "type": "Aviação Geral", "full_name": "Piper PA-34 Seneca"},
    
    # Beechcraft
    "King Air": {"manufacturer": "Beechcraft", "type": "Aviação Geral", "full_name": "Beechcraft King Air"},
}

def lookup_registration(registration: str) -> dict:
    """
    Busca informações de uma aeronave pela matrícula.
    Retorna dados do operador e tipo se encontrado.
    """
    if not registration:
        return None
    
    reg = registration.upper().strip()
    
    # Busca por prefixo exato
    for prefix, data in KNOWN_OPERATORS.items():
        if reg.startswith(prefix):
            return {
                "registration": reg,
                "operator": data["operator"],
                "aircraft_type": data["type"],
                "source": "local_database",
                "confidence": "high" if len(prefix) >= 4 else "medium"
            }
    
    # Tenta identificar país pelo prefixo
    for prefix, country in AIRLINE_PREFIXES.items():
        if reg.startswith(prefix.replace("-", "")):
            return {
                "registration": reg,
                "operator": None,
                "country": country,
                "aircraft_type": None,
                "source": "prefix_match",
                "confidence": "low"
            }
    
    return None

def get_all_operators() -> list:
    """Retorna lista de todos os operadores conhecidos"""
    operators = set()
    for data in KNOWN_OPERATORS.values():
        operators.add(data["operator"])
    return sorted(list(operators))

def get_all_aircraft_types() -> list:
    """Retorna lista de todos os tipos de aeronaves"""
    return ["Airbus", "Boeing", "Embraer", "ATR", "Aviação Geral"]

def get_aircraft_models_by_type(aircraft_type: str) -> list:
    """Retorna modelos de aeronave por tipo"""
    models = []
    for model, data in AIRCRAFT_MODELS.items():
        if data["type"] == aircraft_type:
            models.append({"model": model, "full_name": data["full_name"]})
    return models
