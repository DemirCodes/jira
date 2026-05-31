/**
 * SITE SERVICE
 *
 * Mevcut veritabanı fonksiyonlarıyla uyumlu:
 * - create_sites(p_site_name text, p_site_slug text, p_org_id uuid)
 * - get_sites(p_org_id uuid)
 * - get_site_id(p_site_id uuid, p_project_id uuid) -- dikkat: 2 parametre
 * - list_sites(p_org_id uuid)
 * - update_site_status(p_site_id uuid, p_new_status site_status, p_org_id uuid)
 * - delete_site(p_site_id uuid, p_org_id uuid)
 * - invite_site(p_friendship_code uuid, p_org_id uuid, p_site_id uuid, p_site_role site_role)
 * - update_site(p_site_id uuid, p_site_name text, p_site_slug text, p_is_private boolean)
 */
import { Site, SiteMember, SiteStats } from '../types/site.types';
export declare const createSite: (name: string, slug: string, orgId: string) => Promise<string>;
export declare const getSitesByOrg: (orgId: string) => Promise<Site[]>;
export declare const getSiteById: (siteId: string) => Promise<Site | null>;
export declare const updateSite: (siteId: string, name?: string, slug?: string, isPrivate?: boolean) => Promise<void>;
export declare const updateSiteStatus: (siteId: string, newStatus: string, orgId?: string) => Promise<void>;
export declare const deleteSite: (siteId: string, orgId?: string) => Promise<void>;
export declare const inviteToSite: (friendshipCode: string, orgId: string, siteId: string, role: string) => Promise<string>;
export declare const getSiteMembers: (siteId: string) => Promise<SiteMember[]>;
export declare const updateSiteMemberRole: (siteId: string, memberId: string, role: string) => Promise<void>;
export declare const removeSiteMember: (siteId: string, memberId: string) => Promise<void>;
export declare const getSiteStats: (siteId: string) => Promise<SiteStats>;
//# sourceMappingURL=site.service.d.ts.map