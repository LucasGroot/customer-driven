import psycopg2

#TODO : put this into an .env...
conn = psycopg2.connect(dbname="mockup", user="postgres", password="postgres", host="localhost")

def add_leader():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into leader values
            (0, 'Ikke', 'tildelt', 'normal'),                                                    
            (1, 'Marit', 'Sandvik', 'admin'),
            (2, 'Lene', 'Fjeld', 'normal')
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def add_settings():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into settings values                                                                 
            (0, 25, 50, 75),
            (1, 30, 60, 80),
            (2, 15, 50, 69)
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def add_routine():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into routine values 
            (1, 'Egenmelding ved barns sykdom over flere periode', 'Ansatte spør hvordan egenmeldingsdager telles når barnet er sykt flere ganger i samme måned, og hva som gjelder ved delt omsorg. Rutinen beskriver egenmelding for egen sykdom, men sier lite om barn.', 38, 'new', 0)
            (3, 'Overføring av ferie til neste år', 'Spørsmål om hvor mange dager som kan overføres, hvem som godkjenner, og hva som skjer med dager utover grensen. Rutinen nevner overføring, men ikke fristen eller godkjenningsveien.', 31, 'under consideration', 1)
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def add_settings():
    try:
        cur = conn.cursor()
        try:
            cur.execute("""insert into question values
            (1, 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', '2026-09-02', 1),
            (2, 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', '2026-08-28', 3)
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)