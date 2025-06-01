from django.db import models

class Region(models.Model):
    code_dr = models.CharField(max_length=2, primary_key=True, verbose_name="Code DR")
    nom_region = models.CharField(max_length=100, verbose_name="Nom de la Région")

    def __str__(self):
        return f"{self.nom_region} ({self.code_dr})"

    class Meta:
        verbose_name = "Région (DR)"
        verbose_name_plural = "Régions (DR)"

class Superviseur(models.Model):
    id_superviseur = models.CharField(max_length=20, primary_key=True, verbose_name="ID Superviseur")
    # Ajoutez d'autres champs si nécessaire (nom, contact, etc.)
    # nom = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.id_superviseur

    class Meta:
        verbose_name = "Superviseur"
        verbose_name_plural = "Superviseurs"


class Enqueteur(models.Model):
    login_enq = models.CharField(max_length=20, primary_key=True, verbose_name="Login Enquêteur")
    nom_enqueteur = models.CharField(max_length=255, verbose_name="Nom de l'Enquêteur")
    superviseur = models.ForeignKey(Superviseur, on_delete=models.SET_NULL, null=True, blank=True, related_name='enqueteurs')
    # region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='enqueteurs') # Si un enquêteur est lié à une seule région

    def __str__(self):
        return f"{self.nom_enqueteur} ({self.login_enq})"

    class Meta:
        verbose_name = "Enquêteur"
        verbose_name_plural = "Enquêteurs"


class Menage(models.Model):
    STATUT_NON_AFFECTE = 1
    STATUT_AFFECTE = 2
    STATUT_PARTIEL = 3
    STATUT_COMPLET = 4
    STATUT_N_EXISTE_PLUS = 7
    STATUT_DEMENAGE = 8
    STATUT_REFUS = 9

    STATUT_MENAGE_CHOICES = [
        (STATUT_NON_AFFECTE, "NON AFFECTE"),
        (STATUT_AFFECTE, "AFFECTE"),
        (STATUT_PARTIEL, "PARTIEL"),
        (STATUT_COMPLET, "COMPLET"),
        (STATUT_N_EXISTE_PLUS, "N'existe plus"),
        (STATUT_DEMENAGE, "Déménagé"),
        (STATUT_REFUS, "Refus"),
    ]
    
    # Champs provenant de INFO_MEN_RECORD.CSV et INFO_GEN.CSV
    # Assurez-vous que idmng est unique
    idmng = models.CharField(max_length=50, primary_key=True, verbose_name="ID Ménage")
    
    # Liens
    region = models.ForeignKey(Region, on_delete=models.PROTECT, related_name='menages', verbose_name="Région (DR)")
    superviseur_code = models.CharField(max_length=20, null=True, blank=True, verbose_name="Code Superviseur (du CSV)") # Peut devenir FK à Superviseur plus tard
    enqueteur = models.ForeignKey(Enqueteur, on_delete=models.SET_NULL, null=True, blank=True, related_name='menages_collectes', verbose_name="Enquêteur")

    # Informations du ménage
    hh_trimestre = models.CharField(max_length=50, null=True, blank=True, verbose_name="HH Trimestre")
    cons_code = models.CharField(max_length=50, null=True, blank=True, verbose_name="Code CONS") # Code de la concession/commune
    num_men_csv = models.CharField(max_length=10, null=True, blank=True, verbose_name="Numéro Ménage (CSV)") # NUM_MEN
    
    nom_cc = models.CharField(max_length=255, null=True, blank=True, verbose_name="Nom Chef de Canton/Commune")
    nom_cm = models.CharField(max_length=255, null=True, blank=True, verbose_name="Nom Chef de Ménage")
    
    statut_menage = models.IntegerField(choices=STATUT_MENAGE_CHOICES, default=STATUT_NON_AFFECTE, verbose_name="Statut du Ménage")
    
    # tirage: 1 si le ménage est attendu (tiré au sort)
    tirage = models.IntegerField(null=True, blank=True, verbose_name="Tirage (1 si attendu)") 
    
    adresse = models.TextField(null=True, blank=True)
    telephone1 = models.CharField(max_length=20, null=True, blank=True)
    
    taille_men = models.IntegerField(null=True, blank=True, verbose_name="Taille du Ménage")
    nbr_eligible = models.IntegerField(null=True, blank=True, verbose_name="Nombre de Membres Éligibles") # NBR_ELIGIBLE dans INFO_GEN
    
    date_enquete = models.DateField(null=True, blank=True, verbose_name="Date de l'enquête")
    heure_debut_enquete = models.TimeField(null=True, blank=True, verbose_name="Heure début enquête")
    heure_fin_enquete = models.TimeField(null=True, blank=True, verbose_name="Heure fin enquête")
    
    observations = models.TextField(null=True, blank=True)
    
    # Distinction Urbain/Rural (à déterminer comment l'obtenir)
    # Par exemple, si la région le détermine ou si c'est une autre donnée
    is_rural = models.BooleanField(default=False, verbose_name="Milieu Rural") 

    # Champs pour le statut de collecte (de INFO_MEN_RECORD.CSV)
    # MEMBER_DONE, NB_ELIGIBLE (pour les membres), DO_COMPLETUDE_MENAGE etc.
    # Ceux-ci pourraient être dans un modèle séparé `MembreMenage` si nécessaire pour plus de détails.
    # Pour l'instant, nous nous concentrons sur le statut global du ménage.

    def __str__(self):
        return f"Ménage {self.idmng} - {self.get_statut_menage_display()}"

    class Meta:
        verbose_name = "Ménage"
        verbose_name_plural = "Ménages"