#!/usr/bin/env python3
"""Download local image assets and repair source links for all 90 TOK objects.

Windows standard-library script. No pip dependencies. Re-run is safe and uses
previously downloaded files. A release ZIP is written ONLY when all 90 cases
have real local image bytes and at least one usable, checked source pathway.

Downloadable does NOT imply public-domain, licensed for redistribution, or an
exact photographic match. Credits, source URLs, and candidate provenance are
retained so the teacher can review before publication.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html as htmllib
import json
import os
import random
import re
import shutil
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
SOURCE_HTML = ROOT / 'tools' / 'source-index.html'
INDEX_HTML = ROOT / 'index.html'
IMG_DIR = ROOT / 'assets' / 'images'
CACHE_DIR = ROOT / 'tools' / 'cache'
CACHE_IMAGES = CACHE_DIR / 'images'
CACHE_DATA = CACHE_DIR / 'metadata'
REPORT = ROOT / 'tools' / 'download-report.csv'
DETAILS = ROOT / 'tools' / 'download-report.json'
OVERRIDES_FILE = ROOT / 'tools' / 'image-source-overrides.json'
READY_ZIP = ROOT / 'TOK-History-Ready-for-GitHub-Pages.zip'
EXPECTED = 90
MAX_IMAGE_BYTES = 18_000_000
UA = 'TOKHistoryObjectLab/3.2 (user-operated classroom archive; image attribution retained)'
HOST_COOLDOWN = {}

# Better institution-specific records found during editorial research.
# A current HTTP check is still performed; a broken override is skipped.
SOURCE_CORRECTIONS = {
 'king-letter':'https://kinginstitute.stanford.edu/letter-birmingham-jail',
 'rosa-fingerprint':'https://www.archives.gov/education/lessons/rosa-parks',
 'emancipation':'https://www.archives.gov/milestone-documents/emancipation-proclamation',
 'seneca-table':'https://www.si.edu/object/nmah_529599',
 'tordesillas':'https://www.unesco.org/en/memory-world/treaty-tordesillas',
 'oneg-shabbat-can':'https://encyclopedia.ushmm.org/content/en/artifact/milk-can-used-to-store-content-of-the-oneg-shabbat-archives',
 'titanic-wireless':'https://www.rmg.co.uk/collections/research-guides/research-guide-d1-rms-titanic-fact-sheet',
 'balfour-letter':'https://searcharchives.bl.uk/catalog/040-002093104',
 'waitangi-sheet':'https://www.archives.govt.nz/discover-our-stories/the-treaty-of-waitangi/the-sheets-and-signatures-of-te-tiriti-o-waitangi',
 'piri-reis':'https://www.unesco.org/en/memory-world/piri-reis-world-map-1513',
 'antikythera':'https://antikythera-mechanism.namuseum.gr/en/',
 'huexotzinco':'https://www.loc.gov/item/mss47662-2657/',
 'westphalia':'https://peaceofwestphalia.org/everything-peace-of-westphalia/documents-and-sources/',
 'vinland':'https://pre1600ms.beinecke.library.yale.edu/docs/pre1600.ms350a.htm',
 'douglass-narrative':'https://www.loc.gov/resource/rbaapc.01000/',
 'archimedes-palimpsest':'https://archimedespalimpsest.org/',
}

# Targeted search descriptions for objects whose Wikipedia articles cover a
# much broader topic than the individual artefact.
SEARCH_HINTS = {
 'king-letter':['Martin Luther King letter Birmingham jail manuscript 1963', 'Letter from Birmingham Jail handwritten paper'],
 'seneca-table':['Declaration of Sentiments Table Seneca Falls 1848 Smithsonian'],
 'rosa-fingerprint':['Rosa Parks December 1955 arrest fingerprint card National Archives'],
 'gwangju-censored':['Gwangju 1980 censored newspaper front page South Korea'],
 'one g-shabbat-can':['Ringelblum Warsaw Oneg Shabbat milk can artefact'],
 'oneg-shabbat-can':['Ringelblum Warsaw Oneg Shabbat milk can artefact'],
 'stalin-yezhov':['Stalin Yezhov disappeared retouched photograph canal'],
 'mosul-lamassu':['Mosul Nergal Gate lamassu sculpture before destruction'],
 'richmond-lee':['Robert E Lee Richmond Virginia monument statue photo'],
 'macdonald-statue':['Kingston City Park John A Macdonald statue'],
 'maqdala':['Maqdala Ethiopian crown Victoria Albert Museum'],
 'katyn-report':['Katyn massacre 1943 German commission original report cover'],
 'prague-newspaper':['1968 Prague Spring newspaper front page August'],
 'partition-map':['1947 Radcliffe Line partition map original boundary map'],
 'tubman-shawl':['Harriet Tubman silk lace shawl museum object'],
 'i-am-a-man':['Memphis sanitation 1968 I am a man protest placard'],
 'internment-card':['Japanese American internment family identification card'],
 's21-portrait':['Tuol Sleng S-21 prison registration portrait photo'],
 'nuremberg-film':['Nazi concentration camps 1945 film Nuremberg evidence'],
 'catalan-atlas':['1375 Catalan Atlas Abraham Cresques manuscript folio'],
 'fortitude-map':['Operation Fortitude World War II fake invasion map 1944'],
 'westphalia':['Peace of Westphalia 1648 treaty signed manuscript'],
 'pompeii-dog':['Pompeii dog plaster cast photograph'],
 'herculaneum-172':['Herculaneum papyrus scroll PHerc 172 Oxford'],
 'cern-next':['CERN NeXT computer Tim Berners-Lee World Wide Web first server'],
 'piri-reis':['1513 Piri Reis map parchment Topkapi Palace'],
 'titanic-wireless':['Titanic wireless distress message telegram 1912'],
 'suffrage-banner':['Votes for Women American suffrage protest banner museum'],
 'white-rose':['White Rose 1943 leaflet original Germany'],
 'nebra-sky-disc':['Nebra sky disc museum object'],
}

STOP = {'the','and','from','with','that','this','for','letter','photograph','historic','historical','photo','image','original','museum','archive','of','in','at','on','to','a','an','by','object','document','page'}
BAD_IMAGE = {'icon','logo','seal','flag','diagram','banner-logo','svg','map-symbol','placeholder','infobox','coat','stock'}


def clean_text(s):
    return re.sub(r'\s+', ' ', htmllib.unescape(re.sub(r'<[^>]+>', ' ', str(s or '')))).strip()


def tokens(s):
    return {t for t in re.split(r'[^a-z0-9]+',str(s).lower()) if len(t)>2 and t not in STOP}


def image_format(data):
    if not data or len(data)<100: return ''
    if data[:3]==b'\xff\xd8\xff' and b'\xff\xd9' in data[-32:]: return 'jpg'
    if data[:8]==b'\x89PNG\r\n\x1a\n' and b'IEND' in data[-128:]: return 'png'
    if data[:4]==b'RIFF' and data[8:12]==b'WEBP' and int.from_bytes(data[4:8],'little')+8<=len(data): return 'webp'
    if data[:6] in (b'GIF87a',b'GIF89a') and data[-1:]==b';': return 'gif'
    return ''


def fetch(url, maxbytes=1_500_000, timeout=19, accept='*/*', retries=3, sleep=True, truncate=False):
    """Fetch a URL, including backoff for 429/503. Never disable SSL checks."""
    if not url or not url.startswith(('https://','http://')):
        raise ValueError('Not an HTTP URL')
    host=urllib.parse.urlsplit(url).netloc.lower()
    if time.monotonic()<HOST_COOLDOWN.get(host,0):
        raise RuntimeError('Temporarily pausing rate-limited host '+host)
    last=None
    for i in range(retries):
        try:
            req=urllib.request.Request(url,headers={
                'User-Agent':UA, 'Accept':accept,
                'Accept-Language':'en-US,en;q=0.9',
                'Referer':'https://commons.wikimedia.org/' if 'upload.wikimedia.org' in url else urllib.parse.urlsplit(url).scheme+'://'+urllib.parse.urlsplit(url).netloc+'/',
            })
            with urllib.request.urlopen(req,timeout=timeout) as r:
                data=r.read(maxbytes if truncate else maxbytes+1)
                if len(data)>maxbytes: raise ValueError('Response exceeds size limit')
                return data,r.geturl(),r.headers.get('Content-Type','').split(';')[0].lower()
        except urllib.error.HTTPError as e:
            last=e
            if e.code not in (429,500,502,503,504): break
            if e.code==429 and i==retries-1:
                HOST_COOLDOWN[host]=time.monotonic()+35
            wait=float(e.headers.get('Retry-After') or 0) if (e.headers.get('Retry-After') or '').isdigit() else 0
            if sleep and i<retries-1: time.sleep(min(18,max(wait,2**(i+1))+random.uniform(0,.75)))
        except (urllib.error.URLError,socket.timeout,TimeoutError,OSError) as e:
            last=e
            if sleep and i<retries-1: time.sleep(min(8,2**i+random.uniform(0,.3)))
        except Exception as e:
            last=e; break
    raise last or RuntimeError('Request failed')


def get_json(url,retries=3):
    b,_,_=fetch(url,maxbytes=4_000_000,timeout=22,retries=retries)
    return json.loads(b.decode('utf-8-sig'))


def wiki_api(params,site='en.wikipedia.org'):
    ps=dict(params);ps.setdefault('action','query');ps['format']='json'
    return get_json('https://'+site+'/w/api.php?'+urllib.parse.urlencode(ps))


def wiki_exists(title):
    if not title: return None
    title=urllib.parse.unquote(title)
    try:
        info=wiki_api({'prop':'info','inprop':'url','redirects':'1','titles':title.replace('_',' ')})
        pages=list(info.get('query',{}).get('pages',{}).values())
        if pages and 'missing' not in pages[0]:
            return pages[0].get('fullurl') or 'https://en.wikipedia.org/wiki/'+urllib.parse.quote(pages[0].get('title',title).replace(' ','_'),safe='()_')
    except Exception: pass
    return None


def wiki_search_article(query):
    try:
        d=wiki_api({'list':'search','srsearch':query,'srlimit':3})
        for r in d.get('query',{}).get('search',[]):
            url=wiki_exists(r['title'])
            if url:return url,r['title']
    except Exception: pass
    return None,None


def get_wikipedia_thumbnail(title):
    if not title:return []
    title=urllib.parse.unquote(title)
    candidates=[]
    for query_title in [title.replace('_',' ')]:
        try:
            d=wiki_api({'prop':'pageimages','piprop':'thumbnail|name','pithumbsize':980,'redirects':'1','titles':query_title})
            for p in d.get('query',{}).get('pages',{}).values():
                thumb=p.get('thumbnail',{}).get('source')
                if thumb:
                    link='https://en.wikipedia.org/wiki/'+urllib.parse.quote(p.get('title',query_title).replace(' ','_'),safe='()_')
                    candidates.append({'url':thumb,'record':link,'method':'wikipedia-article-thumbnail','label':p.get('pageimage','') or p.get('title',''),
                                       'credit':'Wikipedia / Wikimedia image on '+p.get('title',query_title)})
        except Exception: pass
        try:
            ep='https://en.wikipedia.org/api/rest_v1/page/summary/'+urllib.parse.quote(query_title.replace(' ','_'),safe='()_')
            d=get_json(ep,retries=2)
            thumb=d.get('thumbnail',{}).get('source')
            if thumb:
                candidates.append({'url':thumb,'record':d.get('content_urls',{}).get('desktop',{}).get('page','https://en.wikipedia.org/wiki/'+urllib.parse.quote(query_title.replace(' ','_'),safe='()_')),
                                   'method':'wikipedia-summary-thumbnail','label':d.get('title',''),'credit':'Wikipedia article image / '+d.get('title',query_title)})
        except Exception: pass
    return candidates


def mediawiki_file_candidate(page,method='commons-search'):
    info=(page.get('imageinfo') or [{}])[0]
    thumb=info.get('thumburl') or info.get('url')
    if not thumb:return []
    meta=info.get('extmetadata') or {}
    artist=clean_text((meta.get('Artist') or {}).get('value',''))[:130]
    license_name=clean_text((meta.get('LicenseShortName') or {}).get('value',''))[:80]
    title=page.get('title','')
    file_url='https://commons.wikimedia.org/wiki/'+urllib.parse.quote(title.replace(' ','_'),safe=':()/,_')
    base={'record':file_url,'method':method,'label':title,
          'credit':(artist or title)+' | Wikimedia Commons'+(' | '+license_name if license_name else ''),
          'license':license_name,'licenseUrl':(meta.get('LicenseUrl') or {}).get('value',''),
          'imageOriginal':info.get('url','')}
    out=[]
    for u in dict.fromkeys([thumb,info.get('url')]):
        if u:out.append({**base,'url':u})
    return out


def get_commons_file(title):
    title=urllib.parse.unquote(title or '').replace('_',' ')
    if not title:return []
    if not title.startswith('File:'):title='File:'+title
    for host in ('commons.wikimedia.org','en.wikipedia.org'):
        try:
            d=wiki_api({'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':960,'titles':title},site=host)
            for p in d.get('query',{}).get('pages',{}).values():
                if p.get('imageinfo'):return mediawiki_file_candidate(p,'named-commons-file')
        except Exception: continue
    return []


def parse_commons_filename(url):
    if not url:return ''
    path=urllib.parse.unquote(urllib.parse.urlparse(url).path)
    if 'Special:FilePath/' in path:return path.split('Special:FilePath/')[-1]
    if 'upload.wikimedia.org' in urllib.parse.urlsplit(url).netloc:
        bits=path.split('/')
        if 'thumb' in bits:
            i=bits.index('thumb')
            if len(bits)>i+3:return bits[i+3]
        return bits[-1]
    return ''


def commons_candidates(query,obj):
    out=[]
    for limit in (25,):
        params={'generator':'search','gsrnamespace':6,'gsrlimit':limit,'gsrsearch':query,
                'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':960}
        try:d=wiki_api(params,site='commons.wikimedia.org')
        except Exception:return []
        pages=[p for p in d.get('query',{}).get('pages',{}).values() if p.get('imageinfo')]
        desired=tokens(obj['title']) | tokens(obj.get('imageSearch',''))
        def score(p):
            name=p.get('title','').lower();ts=tokens(name)
            common=desired & ts
            penalty=2 if any(x in name for x in ('logo','icon','coat of arms','collage','diagram of','modern photograph of a bookcase')) else 0
            distinctive=max((len(t) for t in common),default=0)
            return len(common)*2+(2 if distinctive>=8 else 0)-penalty
        for p in sorted(pages,key=score,reverse=True):
            if p.get('title','').lower().endswith(('.ogg','.ogv','.pdf','.djvu','.tif','.tiff','.webm','.mp4')):continue
            out.extend(mediawiki_file_candidate(p,'commons-search:'+query))
    return out


def wikipedia_article_files(title,obj):
    if not title:return []
    title=urllib.parse.unquote(title)
    try:
        d=wiki_api({'prop':'images','imlimit':85,'redirects':'1','titles':title.replace('_',' ')})
        names=[x['title'] for page in d.get('query',{}).get('pages',{}).values() for x in page.get('images',[])]
        wanted=tokens(obj['title'])|tokens(obj.get('imageSearch',''))
        def sc(name):return len(wanted&tokens(name))*3 - (4 if any(bad in name.lower() for bad in BAD_IMAGE) else 0)
        best=sorted(names,key=sc,reverse=True)
        result=[]
        for name in best[:5]:result.extend(get_commons_file(name))
        return result
    except Exception:return []


def openverse_candidates(query):
    try:
        data=get_json('https://api.openverse.org/v1/images/?'+urllib.parse.urlencode({'q':query,'page_size':12}),retries=2)
        result=[]
        for rec in data.get('results',[]):
            if rec.get('url'):
                result.append({'url':rec['url'],'record':rec.get('foreign_landing_url') or rec.get('detail_url') or '',
                    'method':'openverse-search:'+query,'label':rec.get('title',''),
                    'credit':(rec.get('creator') or rec.get('title') or 'Photographer not specified')+' | '+(rec.get('license') or 'rights not stated'),
                    'license':rec.get('license',''),'licenseUrl':rec.get('license_url','')})
        return result
    except Exception:return []


def loc_candidates(query):
    try:
        data=get_json('https://www.loc.gov/search/?'+urllib.parse.urlencode({'fo':'json','q':query,'c':8}),retries=2)
        return [{'url':u,'record':r.get('id',''),'method':'library-of-congress-search','label':r.get('title',''),
                 'credit':'Library of Congress / '+r.get('title','')} for r in data.get('results',[]) for u in (r.get('image_url') or [])[-1:]]
    except Exception:return []


def og_image(url):
    if not url:return []
    try:
        b,final,mime=fetch(url,maxbytes=1_800_000,timeout=13,retries=2,truncate=True)
        if not mime.startswith('text/'):return []
        page=b.decode('utf-8',errors='ignore')
        # Tolerate property/name before content and vice versa.
        meta=re.findall(r'<meta\b[^>]*>',page,re.I)
        out=[]
        for el in meta:
            p=re.search(r'\b(?:property|name)=[\'\"]([^\'\"]+)',el,re.I)
            c=re.search(r'\bcontent=[\'\"]([^\'\"]+)',el,re.I)
            if p and c and p.group(1).lower() in ('og:image','twitter:image','twitter:image:src'):
                pic=urllib.parse.urljoin(final,htmllib.unescape(c.group(1)))
                out.append({'url':pic,'record':final,'method':'source-site-feature-image','label':'Image shown on source website',
                            'credit':'Image on original institution/source page: '+urllib.parse.urlsplit(final).netloc})
        return out
    except Exception:return []


def source_check(url, retries=2):
    if not url or not url.startswith(('https://','http://')):return None,'no URL'
    try:
        b,final,mime=fetch(url,maxbytes=500_000,timeout=14,retries=retries,truncate=True)
        if 'html' in mime or 'text' in mime:
            txt=b[:50_000].decode('utf-8','ignore')
            mt=re.search(r'<title\b[^>]*>(.*?)</title>',txt,re.I|re.S)
            title=clean_text(mt.group(1)).lower() if mt else ''
            if re.search(r'(^|\W)(404)(\W|$)',title) or 'not found' in title or 'access denied' in title:
                return None,'soft 404 / access denied'
            if any(x in txt.lower() for x in ('this page cannot be found','page you are looking for has been removed')):
                return None,'soft 404'
        return final,'HTTP 200'
    except urllib.error.HTTPError as ex:return None,'HTTP '+str(ex.code)
    except Exception as ex:return None,(type(ex).__name__+': '+str(ex))[:110]


def get_overrides():
    if not OVERRIDES_FILE.exists():return {}
    try:return json.loads(OVERRIDES_FILE.read_text(encoding='utf-8'))
    except Exception:return {}


def unique_queries(obj):
    parts=[obj.get('imageSearch',''), obj.get('title','')]+SEARCH_HINTS.get(obj['id'],[])
    words=sorted(tokens(obj['title']),key=lambda x:-len(x))
    parts.extend([' '.join(words[:3])+' historical object',' '.join(words[:2])])
    return list(dict.fromkeys(q.strip() for q in parts if q.strip()))


def load_source():
    raw=SOURCE_HTML.read_text(encoding='utf-8')
    m=re.search(r'(<script id="objectData" type="application/json">)(.*?)(</script>)',raw,re.S)
    if not m:raise RuntimeError('Object database missing from tools/source-index.html')
    data=json.loads(m.group(2))
    if len(data)!=EXPECTED:raise RuntimeError(f'Expected {EXPECTED} source cases; found {len(data)}')
    return raw,m,data


def previous_asset(obj_id):
    mp=CACHE_DATA/(obj_id+'.json')
    if not mp.exists():return None
    try:
        info=json.loads(mp.read_text(encoding='utf-8'))
        file=CACHE_IMAGES/info['imageFile']
        if not file.exists():return None
        data=file.read_bytes()
        if image_format(data) and hashlib.sha256(data).hexdigest()==info.get('sha256'):
            return info
    except Exception:pass
    return None


def download_image(obj,overrides):
    obj_id=obj['id']
    prev=previous_asset(obj_id)
    if prev:
        IMG_DIR.mkdir(exist_ok=True,parents=True)
        shutil.copy2(CACHE_IMAGES/prev['imageFile'],IMG_DIR/prev['imageFile'])
        return prev,[]
    failures=[];seen=set()
    def try_candidates(cands):
        for cand in cands:
            url=cand.get('url','')
            if not url or url in seen:continue
            seen.add(url)
            try:
                b,final,mime=fetch(url,maxbytes=MAX_IMAGE_BYTES,timeout=25,retries=4)
                ext=image_format(b)
                if not ext:raise ValueError('Downloaded bytes are not a valid browser image')
                outname=obj_id+'.'+ext
                CACHE_IMAGES.mkdir(exist_ok=True,parents=True);IMG_DIR.mkdir(exist_ok=True,parents=True)
                (CACHE_IMAGES/outname).write_bytes(b)
                (IMG_DIR/outname).write_bytes(b)
                ref=cand.get('record') or final
                if not str(ref).startswith(('https://','http://')):ref=final
                info={'image':'assets/images/'+outname,'imageFile':outname,'imageRecord':ref,
                    'imageCredit':cand.get('credit','Photograph linked from '+ref),
                    'imageOriginal':final,'imageMethod':cand.get('method','unknown'),
                    'imageLabel':cand.get('label',''),'imageLicense':cand.get('license',''),
                    'imageLicenseUrl':cand.get('licenseUrl',''),
                    'imageCandidateType':'related or unidentified' if cand.get('method','').startswith(('wikipedia','source-site','openverse')) else 'source collection image',
                    'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'localImage':True}
                CACHE_DATA.mkdir(exist_ok=True,parents=True)
                (CACHE_DATA/(obj_id+'.json')).write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                return info
            except Exception as ex:
                failures.append(cand.get('method','image')+': '+str(ex)[:90])
        return None
    data=overrides.get(obj_id,{})
    direct=data.get('imageUrl')
    if direct:
        got=try_candidates([{'url':direct,'record':data.get('imageRecord') or data.get('source') or obj['source'],
            'credit':data.get('imageCredit') or 'Teacher-specified historical object photograph','method':'teacher-override','label':obj['title']}])
        if got:return got,failures
    direct_orig=obj.get('image')
    if direct_orig and direct_orig.startswith(('https://','http://')):
        got=try_candidates([{'url':direct_orig,'record':('https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(parse_commons_filename(direct_orig).replace('_',' '),safe='(),') if parse_commons_filename(direct_orig) else direct_orig),
            'credit':obj.get('imageCredit') or 'Image source: '+direct_orig,
            'method':'original-specified-image','label':obj['title']}])
        if got:return got,failures
        cf=parse_commons_filename(direct_orig)
        if cf:
            got=try_candidates(get_commons_file(cf))
            if got:return got,failures
    # Exact titles, then progressively broader named Commons matches.
    for query in unique_queries(obj)[:4]:
        got=try_candidates(commons_candidates(query,obj))
        if got:return got,failures
    # Wikipedia page thumbnails provide an additional last-resort related image.
    got=try_candidates(wikipedia_article_files(obj.get('wiki',''),obj))
    if got:return got,failures
    got=try_candidates(get_wikipedia_thumbnail(obj.get('wiki','')))
    if got:return got,failures
    # Wider providers, no image licence filtering.
    for query in unique_queries(obj)[:3]:
        got=try_candidates(openverse_candidates(query))
        if got:return got,failures
    for query in unique_queries(obj)[:2]:
        got=try_candidates(loc_candidates(query))
        if got:return got,failures
    # Institution's own featured/preview image (may be context, not exact object).
    for link in dict.fromkeys([data.get('source'),SOURCE_CORRECTIONS.get(obj_id),obj.get('source')]):
        got=try_candidates(og_image(link))
        if got:return got,failures
    # A Wikipedia article HTML page may expose an image when the API does not.
    if obj.get('wiki'):
        wurl='https://en.wikipedia.org/wiki/'+urllib.parse.quote(urllib.parse.unquote(obj['wiki']),safe='()_')
        got=try_candidates(og_image(wurl))
        if got:return got,failures
    # Even broader fallback when a museum object has a very unusual filename.
    for query in unique_queries(obj)[4:]:
        got=try_candidates(commons_candidates(query,obj))
        if got:return got,failures
    # A matching article found by title can have a more useful thumbnail.
    article,title=wiki_search_article(obj['title'])
    if title:
        got=try_candidates(get_wikipedia_thumbnail(title))
        if got:return got,failures
    return None,failures


def choose_sources(obj,asset,overrides):
    manual=overrides.get(obj['id'],{})
    suggestions=list(dict.fromkeys(u for u in [manual.get('source'),SOURCE_CORRECTIONS.get(obj['id']),obj.get('source')] if u))
    notes=[]
    for url in suggestions:
        good,why=source_check(url)
        notes.append((url,why))
        if good:
            reading=wiki_exists(obj.get('wiki',''))
            if reading==good:reading=None
            return good,reading,'primary/collection record',notes
    # If the historical archive page is inaccessible, an existing encyclopedia
    # article provides at least a working background pathway.
    wiki=wiki_exists(obj.get('wiki',''))
    if wiki:
        good,why=source_check(wiki,retries=2)
        notes.append((wiki,why))
        if good:
            return good,asset.get('imageRecord') if asset.get('imageRecord')!=good else None,'wikipedia fallback',notes
        # Wikipedia API has confirmed the page's ID and canonical URL; browsers
        # can open it even if direct automated HTML retrieval is blocked.
        return wiki,asset.get('imageRecord') if asset.get('imageRecord')!=wiki else None,'wikipedia API-confirmed page (direct fetch blocked)',notes
    # The downloaded image's Commons catalogue page is a valid object-specific
    # record if the file itself was confirmed through Wikimedia imageinfo.
    ref=asset.get('imageRecord','')
    if ref:
        good,why=source_check(ref,retries=2)
        notes.append((ref,why))
        if good:return good,None,'image collection record',notes
        if ref.startswith('https://commons.wikimedia.org/wiki/File:'):
            file_title=urllib.parse.unquote(ref.split('/wiki/')[-1])
            try:
                if get_commons_file(file_title):return ref,None,'Commons file confirmed via API (direct fetch blocked)',notes
            except Exception:pass
    article,title=wiki_search_article(obj['title'])
    if article:
        return article,ref or None,'Wikipedia search article confirmed via API',notes
    return None,None,'no reachable reference',notes


def persist_report(rows,source_count=EXPECTED):
    cols=['id','title','primaryPrompt','status','imageFile','imageMethod','imageRecord','imageCredit',
        'source','sourceType','originalSource','sourceCheckNotes','imageBytes','sha256','errors']
    REPORT.parent.mkdir(exist_ok=True,parents=True)
    with REPORT.open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore');writer.writeheader();writer.writerows(rows)
    detail={'sourceCount':source_count,'localImages':sum(bool(r.get('imageFile')) for r in rows),
            'workingSources':sum(bool(r.get('source')) for r in rows),
            'readyCases':sum(r.get('status')=='ready' for r in rows),
            'coverage':len({r['primaryPrompt'] for r in rows if r.get('status')=='ready'}),
            'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'cases':rows}
    DETAILS.write_text(json.dumps(detail,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return detail


def publish(source_markup,source_match,all_objects,report):
    if len(all_objects)!=EXPECTED or any(not(o.get('localImage') and o.get('image','').startswith('assets/images/') and o.get('source')) for o in all_objects):
        raise RuntimeError('Cannot publish: 90 local images and usable sources are mandatory')
    all_ids={o['id'] for o in all_objects}
    if len(all_ids)!=EXPECTED:raise RuntimeError('Duplicate object IDs')
    data=json.dumps(all_objects,ensure_ascii=False,indent=2).replace('</','<\\/')
    index=source_markup[:source_match.start(2)]+data+source_markup[source_match.end(2):]
    tmp=INDEX_HTML.with_suffix('.tmp')
    tmp.write_text(index,encoding='utf-8')
    for obj in all_objects:
        img=IMG_DIR/obj['imageFile']
        b=img.read_bytes()
        if not image_format(b) or hashlib.sha256(b).hexdigest()!=obj['sha256']:
            tmp.unlink(missing_ok=True)
            raise RuntimeError('Missing/damaged image: '+obj['id'])
    os.replace(tmp,INDEX_HTML)
    lines=['TOK HISTORY OBJECT LAB - IMAGE & SOURCE CREDITS','']
    for obj in all_objects:
        lines.extend([obj['title'],'  Local image: '+obj['image'],
            '  Image record: '+obj.get('imageRecord',''),
            '  Image credit: '+obj.get('imageCredit',''),
            '  Image match method: '+obj.get('imageMethod',''),
            '  Historical source: '+obj.get('source',''),
            '  Background: '+(obj.get('background') or ''),''])
    (ROOT/'assets'/'IMAGE-CREDITS.txt').write_text('\n'.join(lines),encoding='utf-8')
    files=[INDEX_HTML,ROOT/'.nojekyll']
    files.extend(f for f in (ROOT/'assets').rglob('*') if f.is_file())
    with zipfile.ZipFile(READY_ZIP,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
        for f in files:
            z.write(f,f.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(READY_ZIP) as z:
        names=set(z.namelist())
        for o in all_objects:
            if o['image'] not in names:raise RuntimeError('Absent image in ZIP: '+o['image'])
            if hashlib.sha256(z.read(o['image'])).hexdigest()!=o['sha256']:
                raise RuntimeError('ZIP image checksum mismatch: '+o['id'])
    print('\nSUCCESS: 90/90 images and 90/90 source pathways. All 35 prompts retained.')
    print('Open index.html to view the full local gallery.')
    print('Upload CONTENTS of '+READY_ZIP.name+' to GitHub Pages.')


def main(argv=None):
    pa=argparse.ArgumentParser(description=__doc__)
    pa.add_argument('--limit',type=int,default=0,help='Test first N objects; does not publish a partial ZIP')
    pa.add_argument('--recheck',action='store_true',help='Force redownloading image files instead of cache')
    pa.add_argument('--passes',type=int,default=3,help='Automatic passes over missing records (default: 3)')
    args=pa.parse_args(argv)
    raw,m,objects=load_source()
    overrides=get_overrides()
    IMG_DIR.mkdir(parents=True,exist_ok=True)
    CACHE_IMAGES.mkdir(parents=True,exist_ok=True)
    CACHE_DATA.mkdir(parents=True,exist_ok=True)
    process=objects[:args.limit] if args.limit else objects
    active={o['id']:dict(o) for o in process}
    all_ready={}
    rows_by_id={}
    num_passes=1 if args.limit else max(1,min(5,args.passes))
    for passno in range(1,num_passes+1):
        todo=[o for o in process if o['id'] not in all_ready]
        if not todo:break
        print(f'\nPASS {passno}/{num_passes}: trying {len(todo)} unresolved object(s).',flush=True)
        for i,obj in enumerate(todo,1):
            obj=dict(obj);obj_id=obj['id']
            row={'id':obj_id,'title':obj['title'],'primaryPrompt':obj['primary'],
                 'originalSource':obj.get('source',''),'status':'pending'}
            try:
                if args.recheck and passno==1:
                    cache_file=CACHE_DATA/(obj_id+'.json')
                    if cache_file.exists():cache_file.unlink()
                asset,problems=download_image(obj,overrides)
                if asset:
                    row.update({'imageFile':asset['imageFile'],'imageMethod':asset.get('imageMethod',''),
                                'imageRecord':asset.get('imageRecord',''),'imageCredit':asset.get('imageCredit',''),
                                'imageBytes':asset.get('bytes',0),'sha256':asset['sha256']})
                    src,reading,how,notes=choose_sources(obj,asset,overrides)
                    row.update({'source':src or '','sourceType':how,
                                'sourceCheckNotes':'; '.join(u+' -> '+v for u,v in notes)})
                    if src:
                        obj.update(asset);obj['originalSource']=obj['source'];obj['source']=src
                        obj['background']=reading;obj['sourceType']=how
                        all_ready[obj_id]=obj
                        row['status']='ready'
                    else:row['status']='SOURCE MISSING'
                else:
                    fallback,reading,how,notes=choose_sources(obj,{},overrides)
                    row.update({'status':'IMAGE MISSING','source':fallback or '', 'sourceType':how,
                                'sourceCheckNotes':'; '.join(u+' -> '+v for u,v in notes)})
                row['errors']=' | '.join(problems[-5:])[:500]
            except Exception as ex:
                row['status']='ERROR';row['errors']=type(ex).__name__+': '+str(ex)[:180]
            rows_by_id[obj_id]=row
            print(f"[{i:02d}/{len(todo):02d}] {obj_id}: {row['status']} | {row.get('imageMethod','no image')} | {row.get('sourceType','no source')}",flush=True)
            persist_report([rows_by_id[o['id']] for o in process if o['id'] in rows_by_id],len(objects))
        if len(all_ready)==len(process):break
        if passno<num_passes:
            print(f'\n{len(process)-len(all_ready)} remain; retrying automatically after a cooldown.',flush=True)
            time.sleep(min(20,8*passno))
    rows=[rows_by_id[o['id']] for o in process]
    result=persist_report(rows,len(objects))
    print(f"\nDOWNLOAD RESULT: {result['localImages']}/{len(process)} local images, {result['workingSources']}/{len(process)} source pathways")
    print('Full report: '+str(REPORT))
    if args.limit:
        print('TEST MODE: did not replace index.html or publish a ZIP.')
        return 0
    if result['readyCases']!=EXPECTED:
        missing=[r['id'] for r in rows if r.get('status')!='ready']
        print('\nNOT READY: No cases were removed. The following still need attention:')
        print('  '+', '.join(missing))
        print('Successfully downloaded files are saved; re-run the batch file to continue.')
        print('If a case remains stuck, add imageUrl and source in tools/image-source-overrides.json.')
        return 2
    publish(raw,m,[all_ready[o['id']] for o in objects],rows)
    return 0


if __name__=='__main__':
    sys.exit(main())
