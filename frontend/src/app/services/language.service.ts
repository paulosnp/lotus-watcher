import { Injectable, signal, WritableSignal } from '@angular/core';

export type Language = 'pt' | 'en';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    currentLang: WritableSignal<Language> = signal<Language>('pt');

    private translations: Record<Language, Record<string, string>> = {
        pt: {
            // MENU
            'MENU.SETS': 'Expansões',
            'MENU.RANDOM': 'Random',
            'MENU.NOTIFICATIONS': 'Notificações',
            'MENU.LOGIN': 'Entrar',
            'MENU.REGISTER': 'Criar Conta',
            'MENU.PROFILE': 'Meu Perfil',
            'MENU.ADMIN': 'Admin Panel',
            'MENU.WATCHLIST': 'Watchlist',
            'MENU.LOGOUT': 'Sair',

            // HERO / HOME
            'HOME.WELCOME': 'Bem-vindo ao',
            'HOME.SUBTITLE': 'Monitore preços, descubra tendências e proteja sua coleção.',
            'HOME.SEARCH_PLACEHOLDER': 'Digite o nome da carta (ex: Sol Ring)...',

            // FILTERS
            'FILTER.COLORS': 'Cores',
            'FILTER.RARITY': 'Raridade',
            'FILTER.TYPE': 'Tipo',
            'FILTER.APPLY': 'Aplicar Filtros',
            'FILTER.COMMON': 'Comum',
            'FILTER.UNCOMMON': 'Incomum',
            'FILTER.RARE': 'Rara',
            'FILTER.MYTHIC': 'Mítica',
            'FILTER.CREATURE': 'Criatura',
            'FILTER.INSTANT': 'Mágica Instantânea',
            'FILTER.SORCERY': 'Feitiço',
            'FILTER.ENCHANTMENT': 'Encantamento',
            'FILTER.ARTIFACT': 'Artefato',
            'FILTER.PLANESWALKER': 'Planeswalker',
            'FILTER.LAND': 'Terreno',

            // NOTIFICATIONS
            'NOTIF.HEADER': 'Notificações',
            'NOTIF.UNREAD': 'não lidas',
            'NOTIF.EMPTY': 'Nenhuma notificação.',
            'NOTIF.DELETE': 'Apagar',

            // MARKET LISTS
            'MARKET.RISERS': 'Maiores Altas (24h)',
            'MARKET.FALLERS': 'Maiores Quedas (24h)',
            'MARKET.EMPTY': 'Carregando dados do mercado...',
            'MARKET.NO_RESULTS': 'Nenhuma carta encontrada.',
            'MARKET.SEARCH_RESULTS': 'Resultados para',

            // CARD DETAILS
            'CARD.CURRENT_PRICE': 'Preço Atual',
            'CARD.SEE_LIGAMAGIC': 'Ver na LigaMagic',
            'CARD.PRICE_HISTORY': 'Histórico de Preço',
            'CARD.UPDATED_AT': 'Atualizado em',
            'CARD.OTHER_VERSIONS': 'Outras Versões & Edições',
            'CARD.LOADING': 'Acessando os arquivos do multiverso...',

            // PROFILE
            'PROFILE.UPLOAD_TOOLTIP': 'Fazer Upload de Imagem',
            'PROFILE.DEFAULT_USER': 'Usuário',
            'PROFILE.CHOOSE_AVATAR': 'Escolha seu Avatar',
            'PROFILE.PERSONAL_INFO': 'Informações Pessoais',
            'PROFILE.EDIT_NAME_TOOLTIP': 'Editar Nome',
            'PROFILE.EMAIL_LABEL': 'Email',
            'PROFILE.DISPLAY_NAME_LABEL': 'Nome de Exibição',
            'PROFILE.NO_NAME': 'Sem nome',
            'PROFILE.NICK_PLACEHOLDER': 'Seu nick',
            'PROFILE.SAVE_NAME_TOOLTIP': 'Salvar Nome',
            'PROFILE.CANCEL_TOOLTIP': 'Cancelar',
            'PROFILE.SECURITY_SECTION': 'Segurança',
            'PROFILE.CHANGE_PASS_BTN': 'Alterar Senha',
            'PROFILE.CHANGE_PASS_HINT': 'Preencha os campos para alterar sua senha.',
            'PROFILE.CURRENT_PASS_LABEL': 'Senha Atual',
            'PROFILE.CURRENT_PASS_PLACEHOLDER': 'Digite sua senha atual',
            'PROFILE.NEW_PASS_LABEL': 'Nova Senha',
            'PROFILE.NEW_PASS_PLACEHOLDER': 'Digite a nova senha',
            'PROFILE.CONFIRM_PASS_LABEL': 'Confirmar Nova Senha',
            'PROFILE.CONFIRM_PASS_PLACEHOLDER': 'Confirme a nova senha',
            'PROFILE.CONFIRM_PASS_BTN': 'Confirmar Nova Senha',
            'PROFILE.SAVE_AVATAR_BTN': 'Salvar Avatar',

            // FOOTER
            'FOOTER.DEVELOPED_BY': 'Desenvolvido por',
            'FOOTER.COPYRIGHT': '© 2026 Lotus Watcher Project. Sem fins lucrativos.',
            'FOOTER.DISCLAIMER': 'Magic: The Gathering é uma marca registrada da Wizards of the Coast. Este site não é afiliado à Wizards of the Coast.',
            'FOOTER.DATA_PROVIDED': 'Dados de preços fornecidos por',
            'FOOTER.PRIVACY': 'Política de Privacidade',
            'FOOTER.TERMS': 'Termos de Uso',
            'FOOTER.COOKIES': 'Cookies',
            'FOOTER.ABOUT': 'Sobre o Lotus Watcher',
            'FOOTER.COMMUNITY': 'Comunidade',
            'FOOTER.OFFICIAL_SITE': 'Site Oficial MTG',
            'FOOTER.REPORT_BUG': 'Reportar Bug',
            'FOOTER.CONTACT': 'Contato',

            // SETS
            'SETS.TITLE': 'Expansões de Magic',
            'SETS.LOADING': 'Carregando expansões...',
            'SETS.EMPTY': 'Nenhuma expansão encontrada.',

            // ADMIN
            'ADMIN.HEADER': 'Painel Administrativo',
            'ADMIN.ELEGANCE': 'Visão geral do sistema e controles.',
            'ADMIN.USERS': 'Usuários',
            'ADMIN.CARDS_IN_DB': 'Cartas no Banco',
            'ADMIN.SYSTEM_ACTIONS': 'Ações do Sistema',
            'ADMIN.SYNC_SCRYFALL': 'Sincronizar Scryfall',
            'ADMIN.SYNC_DESC': 'Atualiza preços de TODAS as cartas no banco. Processo demorado.',
            'ADMIN.SYNC_BTN': 'Sincronizar Agora',
            'ADMIN.SYNCING_BTN': 'Sincronizando...',
            'ADMIN.BULK_IMPORT': 'Bulk Import (Novo)',
            'ADMIN.USER_MANAGEMENT': 'Gerenciamento de Usuários',
            'ADMIN.TABLE_NAME': 'Nome',
            'ADMIN.TABLE_EMAIL': 'Email',
            'ADMIN.TABLE_STATUS': 'Status',
            'ADMIN.TABLE_ACTIONS': 'Ações',
            'ADMIN.STATUS_ACTIVE': 'Ativo',
            'ADMIN.STATUS_BANNED': 'Bloqueado',
            'ADMIN.BTN_BLOCK': 'Bloquear',
            'ADMIN.BTN_UNBLOCK': 'Desbloquear',
            'ADMIN.BTN_PROMOTE_TOOLTIP': 'Promover',
            'ADMIN.BTN_DEMOTE_TOOLTIP': 'Rebaixar',
            'ADMIN.BTN_DELETE_TOOLTIP': 'Excluir Usuário',
            'ADMIN.EMPTY_USERS': 'Nenhum usuário encontrado.',

            // ADMIN CARDS
            'ADMIN.CARDS_TITLE': 'Gerenciamento de Cartas',
            'ADMIN.CARDS_SUBTITLE': 'Visualizando todas as cartas monitoradas pelo sistema.',
            'ADMIN.BACK_BTN': 'Voltar',
            'ADMIN.CARDS_LOADING': 'Carregando cartas...',
            'ADMIN.TH_IMG': 'Img',
            'ADMIN.TH_NAME': 'Nome',
            'ADMIN.TH_SET': 'Set',
            'ADMIN.TH_PRICE': 'Preço (USD)',
            'ADMIN.TH_ACTIONS': 'Ações',
            'ADMIN.PAGE': 'Página',
            'ADMIN.OF': 'de',

            // MARKET / SEARCH
            'MARKET.ADVANCED_SEARCH_RESULTS': 'Resultados da Pesquisa Avançada',
        },
        en: {
            // MENU
            'MENU.SETS': 'Sets',
            'MENU.RANDOM': 'Random',
            'MENU.NOTIFICATIONS': 'Notifications',
            'MENU.LOGIN': 'Login',
            'MENU.REGISTER': 'Register',
            'MENU.PROFILE': 'My Profile',
            'MENU.ADMIN': 'Admin Panel',
            'MENU.WATCHLIST': 'Watchlist',
            'MENU.LOGOUT': 'Logout',

            // HERO / HOME
            'HOME.WELCOME': 'Welcome to',
            'HOME.SUBTITLE': 'Track prices, discover trends, and protect your collection.',
            'HOME.SEARCH_PLACEHOLDER': 'Enter card name (e.g. Sol Ring)...',

            // FILTERS
            'FILTER.COLORS': 'Colors',
            'FILTER.RARITY': 'Rarity',
            'FILTER.TYPE': 'Type',
            'FILTER.APPLY': 'Apply Filters',
            'FILTER.COMMON': 'Common',
            'FILTER.UNCOMMON': 'Uncommon',
            'FILTER.RARE': 'Rare',
            'FILTER.MYTHIC': 'Mythic',
            'FILTER.CREATURE': 'Creature',
            'FILTER.INSTANT': 'Instant',
            'FILTER.SORCERY': 'Sorcery',
            'FILTER.ENCHANTMENT': 'Enchantment',
            'FILTER.ARTIFACT': 'Artifact',
            'FILTER.PLANESWALKER': 'Planeswalker',
            'FILTER.LAND': 'Land',

            // NOTIFICATIONS
            'NOTIF.HEADER': 'Notifications',
            'NOTIF.UNREAD': 'unread',
            'NOTIF.EMPTY': 'No notifications.',
            'NOTIF.DELETE': 'Delete',

            // MARKET LISTS
            'MARKET.RISERS': 'Top Risers (24h)',
            'MARKET.FALLERS': 'Top Fallers (24h)',
            'MARKET.EMPTY': 'Loading market data...',
            'MARKET.NO_RESULTS': 'No cards found.',
            'MARKET.SEARCH_RESULTS': 'Results for',
            'MARKET.ADVANCED_SEARCH_RESULTS': 'Advanced Search Results',

            // CARD DETAILS
            'CARD.CURRENT_PRICE': 'Current Price',
            'CARD.SEE_LIGAMAGIC': 'See on LigaMagic',
            'CARD.PRICE_HISTORY': 'Price History',
            'CARD.UPDATED_AT': 'Updated at',
            'CARD.OTHER_VERSIONS': 'Other Versions & Editions',
            'CARD.LOADING': 'Accessing multiverse files...',

            // PROFILE
            'PROFILE.UPLOAD_TOOLTIP': 'Upload Image',
            'PROFILE.DEFAULT_USER': 'User',
            'PROFILE.CHOOSE_AVATAR': 'Choose your Avatar',
            'PROFILE.PERSONAL_INFO': 'Personal Information',
            'PROFILE.EDIT_NAME_TOOLTIP': 'Edit Name',
            'PROFILE.EMAIL_LABEL': 'Email',
            'PROFILE.DISPLAY_NAME_LABEL': 'Display Name',
            'PROFILE.NO_NAME': 'No name',
            'PROFILE.NICK_PLACEHOLDER': 'Your nick',
            'PROFILE.SAVE_NAME_TOOLTIP': 'Save Name',
            'PROFILE.CANCEL_TOOLTIP': 'Cancel',
            'PROFILE.SECURITY_SECTION': 'Security',
            'PROFILE.CHANGE_PASS_BTN': 'Change Password',
            'PROFILE.CHANGE_PASS_HINT': 'Fill in the fields to change your password.',
            'PROFILE.CURRENT_PASS_LABEL': 'Current Password',
            'PROFILE.CURRENT_PASS_PLACEHOLDER': 'Enter current password',
            'PROFILE.NEW_PASS_LABEL': 'New Password',
            'PROFILE.NEW_PASS_PLACEHOLDER': 'Enter new password',
            'PROFILE.CONFIRM_PASS_LABEL': 'Confirm New Password',
            'PROFILE.CONFIRM_PASS_PLACEHOLDER': 'Confirm new password',
            'PROFILE.CONFIRM_PASS_BTN': 'Confirm New Password',
            'PROFILE.SAVE_AVATAR_BTN': 'Save Avatar',

            // FOOTER
            'FOOTER.DEVELOPED_BY': 'Developed by',
            'FOOTER.COPYRIGHT': '© 2026 Lotus Watcher Project. Non-profit.',
            'FOOTER.DISCLAIMER': 'Magic: The Gathering is a trademark of Wizards of the Coast. This site is not affiliated with Wizards of the Coast.',
            'FOOTER.DATA_PROVIDED': 'Price data provided by',
            'FOOTER.PRIVACY': 'Privacy Policy',
            'FOOTER.TERMS': 'Terms of Use',
            'FOOTER.COOKIES': 'Cookies',
            'FOOTER.ABOUT': 'About Lotus Watcher',
            'FOOTER.COMMUNITY': 'Community',
            'FOOTER.OFFICIAL_SITE': 'Official MTG Site',
            'FOOTER.REPORT_BUG': 'Report Bug',
            'FOOTER.CONTACT': 'Contact',

            // SETS
            'SETS.TITLE': 'Magic Sets',
            'SETS.LOADING': 'Loading sets...',
            'SETS.EMPTY': 'No sets found.',

            // ADMIN
            'ADMIN.HEADER': 'Admin Panel',
            'ADMIN.ELEGANCE': 'System overview and controls.',
            'ADMIN.USERS': 'Users',
            'ADMIN.CARDS_IN_DB': 'Cards in DB',
            'ADMIN.SYSTEM_ACTIONS': 'System Actions',
            'ADMIN.SYNC_SCRYFALL': 'Sync Scryfall',
            'ADMIN.SYNC_DESC': 'Updates prices for ALL cards in database. This takes detailed time.',
            'ADMIN.SYNC_BTN': 'Sync Now',
            'ADMIN.SYNCING_BTN': 'Syncing...',
            'ADMIN.BULK_IMPORT': 'Bulk Import (New)',
            'ADMIN.USER_MANAGEMENT': 'User Management',
            'ADMIN.TABLE_NAME': 'Name',
            'ADMIN.TABLE_EMAIL': 'Email',
            'ADMIN.TABLE_STATUS': 'Status',
            'ADMIN.TABLE_ACTIONS': 'Actions',
            'ADMIN.STATUS_ACTIVE': 'Active',
            'ADMIN.STATUS_BANNED': 'Banned',
            'ADMIN.BTN_BLOCK': 'Ban',
            'ADMIN.BTN_UNBLOCK': 'Unban',
            'ADMIN.BTN_PROMOTE_TOOLTIP': 'Promote',
            'ADMIN.BTN_DEMOTE_TOOLTIP': 'Demote',
            'ADMIN.BTN_DELETE_TOOLTIP': 'Delete User',
            'ADMIN.EMPTY_USERS': 'No users found.',

            // ADMIN CARDS
            'ADMIN.CARDS_TITLE': 'Card Management',
            'ADMIN.CARDS_SUBTITLE': 'Viewing all cards tracked by the system.',
            'ADMIN.BACK_BTN': 'Back',
            'ADMIN.CARDS_LOADING': 'Loading cards...',
            'ADMIN.TH_IMG': 'Img',
            'ADMIN.TH_NAME': 'Name',
            'ADMIN.TH_SET': 'Set',
            'ADMIN.TH_PRICE': 'Price (USD)',
            'ADMIN.TH_ACTIONS': 'Actions',
            'ADMIN.PAGE': 'Page',
            'ADMIN.OF': 'of',
        }
    };

    constructor() {
        // 1. Try to recover from localStorage
        const savedLang = localStorage.getItem('lotus-lang') as Language;
        if (savedLang && (savedLang === 'pt' || savedLang === 'en')) {
            this.currentLang.set(savedLang);
        } else {
            // 2. If no saved preference, check browser language
            const browserLang = navigator.language || (navigator.languages && navigator.languages[0]);
            // If browser language is NOT Portuguese (pt-BR, pt-PT, etc), default to English
            if (browserLang && !browserLang.toLowerCase().startsWith('pt')) {
                this.currentLang.set('en');
            }
            // Else, it defaults to 'pt' as initialized
        }
    }

    toggleLanguage() {
        const newLang = this.currentLang() === 'pt' ? 'en' : 'pt';
        this.currentLang.set(newLang);
        localStorage.setItem('lotus-lang', newLang);
    }

    getTranslation(key: string): string {
        const lang = this.currentLang();
        return this.translations[lang][key] || key;
    }
}
