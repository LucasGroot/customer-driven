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
            ('1234-5', 'Egenmelding ved barns sykdom over flere periode', 'new', '2026-06-10', 1),
            ('6789-0', 'Overføring av ferie til neste år', 'under consideration', ‘2026-10-10’, 0)

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
            ('INC1234567', 'belebele', 'stupid question', 'Jeg har 9 dager igjen. Kan jeg ta med alle til neste år, eller mister jeg noen?', '2026-09-02'),
            ('INC1234568', 'pru', 'noen i uke', 'Vi har delt omsorg annenhver uke. Teller dagene bare når barnet bor hos meg?', '2026-08-28')
            ;""")
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)