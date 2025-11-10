// Données des 17 Objectifs de Développement Durable (ODD)
export interface ODD {
  id: number;
  title: string;
  description: string;
  image: string;
  color: string;
}

export const ODD_DATA: ODD[] = [
  {
    id: 1,
    title: "Éliminer la pauvreté",
    description: "Éliminer la pauvreté sous toutes ses formes et partout dans le monde",
    image: "https://via.placeholder.com/100x100/E74C3C/FFFFFF?text=1",
    color: "#E74C3C"
  },
  {
    id: 2,
    title: "Éliminer la faim",
    description: "Éliminer la faim, assurer la sécurité alimentaire, améliorer la nutrition et promouvoir l'agriculture durable",
    image: "https://via.placeholder.com/100x100/F39C12/FFFFFF?text=2",
    color: "#F39C12"
  },
  {
    id: 3,
    title: "Bonne santé et bien-être",
    description: "Permettre à tous de vivre en bonne santé et promouvoir le bien-être de tous à tout âge",
    image: "https://via.placeholder.com/100x100/27AE60/FFFFFF?text=3",
    color: "#27AE60"
  },
  {
    id: 4,
    title: "Éducation de qualité",
    description: "Assurer l'accès de tous à une éducation de qualité, sur un pied d'égalité, et promouvoir les possibilités d'apprentissage tout au long de la vie",
    image: "https://via.placeholder.com/100x100/8E44AD/FFFFFF?text=4",
    color: "#8E44AD"
  },
  {
    id: 5,
    title: "Égalité entre les sexes",
    description: "Parvenir à l'égalité des sexes et autonomiser toutes les femmes et les filles",
    image: "https://via.placeholder.com/100x100/E67E22/FFFFFF?text=5",
    color: "#E67E22"
  },
  {
    id: 6,
    title: "Eau propre et assainissement",
    description: "Garantir l'accès de tous à l'eau et à l'assainissement et assurer une gestion durable des ressources en eau",
    image: "https://via.placeholder.com/100x100/3498DB/FFFFFF?text=6",
    color: "#3498DB"
  },
  {
    id: 7,
    title: "Énergie propre et d'un coût abordable",
    description: "Garantir l'accès de tous à des services énergétiques fiables, durables et modernes, à un coût abordable",
    image: "https://via.placeholder.com/100x100/F1C40F/FFFFFF?text=7",
    color: "#F1C40F"
  },
  {
    id: 8,
    title: "Travail décent et croissance économique",
    description: "Promouvoir une croissance économique soutenue, partagée et durable, le plein emploi productif et un travail décent pour tous",
    image: "https://via.placeholder.com/100x100/2ECC71/FFFFFF?text=8",
    color: "#2ECC71"
  },
  {
    id: 9,
    title: "Industrie, innovation et infrastructure",
    description: "Bâtir une infrastructure résiliente, promouvoir une industrialisation durable qui profite à tous et encourager l'innovation",
    image: "https://via.placeholder.com/100x100/E67E22/FFFFFF?text=9",
    color: "#E67E22"
  },
  {
    id: 10,
    title: "Inégalités réduites",
    description: "Réduire les inégalités dans les pays et d'un pays à l'autre",
    image: "https://via.placeholder.com/100x100/E74C3C/FFFFFF?text=10",
    color: "#E74C3C"
  },
  {
    id: 11,
    title: "Villes et communautés durables",
    description: "Faire en sorte que les villes et les établissements humains soient ouverts à tous, sûrs, résilients et durables",
    image: "https://via.placeholder.com/100x100/F39C12/FFFFFF?text=11",
    color: "#F39C12"
  },
  {
    id: 12,
    title: "Consommation et production responsables",
    description: "Établir des modes de consommation et de production durables",
    image: "https://via.placeholder.com/100x100/27AE60/FFFFFF?text=12",
    color: "#27AE60"
  },
  {
    id: 13,
    title: "Mesures relatives à la lutte contre les changements climatiques",
    description: "Prendre d'urgence des mesures pour lutter contre les changements climatiques et leurs répercussions",
    image: "https://via.placeholder.com/100x100/2ECC71/FFFFFF?text=13",
    color: "#2ECC71"
  },
  {
    id: 14,
    title: "Vie aquatique",
    description: "Conserver et exploiter de manière durable les océans, les mers et les ressources marines aux fins du développement durable",
    image: "https://via.placeholder.com/100x100/3498DB/FFFFFF?text=14",
    color: "#3498DB"
  },
  {
    id: 15,
    title: "Vie terrestre",
    description: "Préserver et restaurer les écosystèmes terrestres, en veillant à les exploiter de façon durable",
    image: "https://via.placeholder.com/100x100/27AE60/FFFFFF?text=15",
    color: "#27AE60"
  },
  {
    id: 16,
    title: "Paix, justice et institutions efficaces",
    description: "Promouvoir l'avènement de sociétés pacifiques et ouvertes aux fins du développement durable",
    image: "https://via.placeholder.com/100x100/8E44AD/FFFFFF?text=16",
    color: "#8E44AD"
  },
  {
    id: 17,
    title: "Partenariats pour la réalisation des objectifs",
    description: "Renforcer les moyens de mettre en œuvre le Partenariat mondial pour le développement durable",
    image: "https://via.placeholder.com/100x100/2ECC71/FFFFFF?text=17",
    color: "#2ECC71"
  }
];

// Fonction utilitaire pour obtenir un ODD par son ID
export const getODDById = (id: number): ODD | undefined => {
  return ODD_DATA.find(odd => odd.id === id);
};

// Fonction utilitaire pour obtenir tous les ODD
export const getAllODDs = (): ODD[] => {
  return ODD_DATA;
};
